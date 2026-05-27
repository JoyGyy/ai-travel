/**
 * AI 对话路由
 * POST /api/travel/chat - 流式对话
 */

const { Router } = require('express')
const { initSSE, sendSSE, sendError } = require('../utils/sse')
const { retrieve, getAllCities } = require('../services/rag')
const { callLLMStream } = require('../services/llm')

const router = Router()

// Mock 回复模板：根据用户问题关键词匹配
const mockResponses = {
  '景点': '推荐您去以下景点：\n\n1. **故宫博物院** - 明清皇家宫殿，必去打卡地\n2. **长城** - 世界奇迹，气势磅礴\n3. **天坛公园** - 古代祭天场所，建筑精美\n\n建议提前网上预约门票，合理安排游览时间。',
  '美食': '当地特色美食推荐：\n\n1. 烤鸭 - 皮脆肉嫩，当地名菜\n2. 小吃街 - 各种地道小吃集中地\n3. 特色面食 - 当地传统面食\n\n建议去当地人常去的老店品尝，味道更正宗。',
  '攻略': '为您整理的旅行攻略：\n\n**交通**：建议乘坐公共交通，方便快捷\n**住宿**：建议住在市中心或景区附近\n**行程**：合理安排时间，不要贪多\n**预算**：提前规划好各项开支\n\n祝您旅途愉快！',
  '保险': '旅行保险购买建议：\n\n1. 选择包含意外医疗和紧急救援的保险\n2. 注意保障范围是否覆盖目的地\n3. 高风险活动（如潜水、滑雪）需要额外保障\n4. 建议在出发前至少一天购买\n\n推荐平台：支付宝、携程、慧择等。',
  'default': '你好！我是你的 AI 旅行顾问，可以帮你：\n\n1. 规划旅行行程\n2. 推荐当地景点和美食\n3. 提供旅行攻略和建议\n4. 解答旅行相关问题\n\n请告诉我你想去哪里旅行，我来帮你规划！',
}

/**
 * 根据用户消息生成 Mock 回复
 * @param {string} message - 用户消息
 * @returns {string} 回复内容
 */
function getMockResponse(message) {
  for (const [keyword, response] of Object.entries(mockResponses)) {
    if (keyword !== 'default' && message.includes(keyword)) {
      return response
    }
  }
  return mockResponses.default
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
    const cities = getAllCities()

    // 检查消息中是否包含城市名
    for (const city of cities) {
      if (message.includes(city)) {
        const result = retrieve(city, [], city)
        if (result) {
          contextInfo = `\n\n参考信息：${city}的热门景点有${result.attractions.slice(0, 5).map(a => a.name).join('、')}。推荐美食：${result.food.join('、')}。最佳季节：${result.bestSeason}。`
          ragSources = result.attractions.slice(0, 5).map(a => a.name)
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
      const mockReply = getMockResponse(message)
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
