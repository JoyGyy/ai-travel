/**
 * AI 对话路由
 * POST /api/travel/chat - 流式对话
 */

const { Router } = require('express')
const { initSSE, sendSSE, sendError } = require('../utils/sse')
const { retrieve, getAllCities } = require('../services/rag')
const { callLLMStream } = require('../services/llm')

const router = Router()

/**
 * 根据用户消息和 RAG 上下文生成 Mock 回复
 */
function getMockResponse(message, ragResult) {
  if (ragResult) {
    const { attractions, food, bestSeason, transportation } = ragResult
    const city = ragResult.city || '该城市'
    const isFood = /美食|吃|餐厅|小吃/.test(message)
    const isTransport = /交通|怎么去|怎么走|机场|高铁|火车站/.test(message)
    const isPlan = /天|日|行程|预算|规划|攻略|玩/.test(message) || (/去/.test(message) && !/^去[^\s]{2,4}$/.test(message.trim()))
    const allCitySpots = require('../knowledge/attractions.json').find(c => c.city === city)?.attractions || []
    const isSpecificSpot = allCitySpots.find(a => message.includes(a.name))

    if (isSpecificSpot) {
      return `**${isSpecificSpot.name}**\n\n${isSpecificSpot.description || ''}\n\n门票：${isSpecificSpot.ticket ? isSpecificSpot.ticket + '元' : '免费'}\n开放时间：${isSpecificSpot.openTime || '全天'}\n建议游玩时长：${isSpecificSpot.duration || '2-3小时'}\n交通：${isSpecificSpot.transportation || '公共交通可达'}\n\n建议提前规划好行程，避免高峰期。`
    }
    if (isFood) {
      return `${city}特色美食推荐：\n\n${food.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n建议去当地人常去的老店品尝，味道更正宗。`
    }
    if (isTransport) {
      return `${city}交通指南：\n\n${transportation || '建议乘坐公共交通，方便快捷。景区之间可乘坐地铁或公交。'}\n\n最佳旅行季节：${bestSeason || '春秋两季'}。`
    }
    if (isPlan) {
      const days = message.match(/(\d)\s*[天日]/)?.[1]
      const budget = message.match(/(\d+)\s*(元|块|¥|￥)/)?.[1]
      const dayText = days ? `${days}天` : '3天'
      const spotList = attractions.slice(0, days ? Number(days) * 2 : 6)
      return `为您规划${city}${dayText}行程：\n\n${spotList.map((a, i) => `**第${Math.floor(i / 2) + 1}${i % 2 === 0 ? '上午' : '下午'}** — ${a.name}（${a.duration || '2-3小时'}）`).join('\n')}\n\n推荐美食：${food.slice(0, 3).join('、')}${budget ? `\n预算参考：${budget}元足够${dayText}深度游` : ''}\n最佳季节：${bestSeason || '春秋两季'}。\n\n想要更详细的行程安排，可以使用首页的「行程规划」功能！`
    }
    const topSpots = attractions.slice(0, 5)
    return `${city}热门景点推荐：\n\n${topSpots.map((a, i) => `${i + 1}. **${a.name}** — ${a.description || ''}${a.ticket && a.ticket !== 0 ? `（门票${a.ticket}元）` : '（免费）'}`).join('\n')}\n\n推荐美食：${food.slice(0, 3).join('、')}。\n最佳季节：${bestSeason || '春秋两季'}。\n\n需要更详细的行程规划吗？`
  }

  if (message.includes('保险')) {
    return '旅行保险购买建议：\n\n1. 选择包含意外医疗和紧急救援的保险\n2. 注意保障范围是否覆盖目的地\n3. 高风险活动需要额外保障\n4. 建议在出发前至少一天购买\n\n推荐平台：支付宝、携程、慧择等。'
  }

  return '你好！我是你的 AI 旅行顾问，可以帮你：\n\n1. 规划旅行行程\n2. 推荐当地景点和美食\n3. 提供旅行攻略和建议\n4. 解答旅行相关问题\n\n请告诉我你想去哪里旅行，我来帮你规划！'
}

/**
 * POST /api/travel/chat
 * 请求体：{ message: string }
 * 响应：SSE 流，逐步返回 AI 回复
 */
router.post('/chat', async (req, res) => {
  try {
    initSSE(res)

    const { message } = req.body
    if (!message) {
      sendError(res, '请输入你的问题')
      res.end()
      return
    }

    // 尝试从知识库检索相关信息
    let contextInfo = ''
    let ragSources = []
    let ragResult = null
    const cities = getAllCities()

    // 先检查是否包含城市名
    for (const city of cities) {
      if (message.includes(city)) {
        const result = retrieve(city, [], city)
        if (result) {
          ragResult = { ...result, city }
          contextInfo = `\n\n参考信息：${city}的热门景点有${result.attractions.slice(0, 5).map(a => a.name).join('、')}。推荐美食：${result.food.join('、')}。最佳季节：${result.bestSeason}。`
          ragSources = result.attractions.slice(0, 5).map(a => a.name)
          break
        }
      }
    }

    // 如果没匹配到城市，检查是否提到景点名
    if (!ragResult) {
      const attractionsDB = require('../knowledge/attractions.json')
      for (const cityData of attractionsDB) {
        const found = cityData.attractions.find(a => message.includes(a.name))
        if (found) {
          const result = retrieve(cityData.city, [], message)
          ragResult = { ...result, city: cityData.city }
          contextInfo = `\n\n参考信息：${found.name}位于${cityData.city}。${cityData.city}的热门景点还有${result.attractions.filter(a => a.name !== found.name).slice(0, 4).map(a => a.name).join('、')}。`
          ragSources = [found.name, ...result.attractions.filter(a => a.name !== found.name).slice(0, 4).map(a => a.name)]
          break
        }
      }
    }

    // 尝试真实 LLM 调用
    const systemPrompt = '你是一个专业的旅行顾问，为用户提供旅行建议和行程规划。回答要简洁实用，使用中文。'
    const userPrompt = contextInfo
      ? `用户问题：${message}\n${contextInfo}\n请根据以上信息回答用户问题。`
      : message

    let fullContent = ''
    let usedLLM = false

    try {
      fullContent = await callLLMStream(systemPrompt, userPrompt, (chunk) => {
        usedLLM = true
        sendSSE(res, { type: 'chunk', content: chunk })
      })
    }
    catch {
      // LLM 调用失败，使用 Mock 回复
    }

    // 如果 LLM 没有返回内容，使用 Mock 回复
    if (!usedLLM || !fullContent) {
      const mockReply = getMockResponse(message, ragResult)
      // 模拟流式输出，逐字符发送
      let accumulated = ''
      for (const char of mockReply) {
        accumulated += char
        sendSSE(res, { type: 'chunk', content: char })
        // 每几个字符延迟一下，模拟打字效果
        if (char === '\n' || accumulated.length % 5 === 0) {
          await delay(20)
        }
      }
      fullContent = mockReply
    }

    // 发送完成信号，附带 RAG 引用来源
    sendSSE(res, { type: 'complete', data: { content: fullContent, sources: ragSources } })
  }
  catch (err) {
    console.error('对话失败:', err)
    sendError(res, '处理消息时出现错误，请稍后重试')
  }
  finally {
    res.end()
  }
})

/**
 * 延迟函数
 * @param {number} ms - 延迟毫秒数
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = router
