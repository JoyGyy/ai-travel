/**
 * AI 对话路由（Agent 模式）
 * POST /api/travel/chat - LLM 通过 function calling 自主调用工具回答问题
 */

const { Router } = require('express')
const { initSSE, sendSSE, sendError } = require('../utils/sse')
const { retrieve, getAllCities } = require('../services/rag')
const { callLLMWithTools, getLLMConfig } = require('../services/llm')

const router = Router()

// ========== Chat Agent System Prompt ==========

const CHAT_SYSTEM_PROMPT = `你是一个专业的旅行顾问 AI 助手。你可以帮用户：
1. 推荐旅游城市和景点
2. 规划旅行行程
3. 推荐当地美食
4. 提供交通和旅行建议

你有一个工具 search_travel_info 可以查询旅行知识库。当用户询问具体城市、景点、美食、交通等信息时，必须先调用工具获取准确数据，再基于数据回答。
回答要简洁实用，使用中文，适当使用 Markdown 格式。`

// ========== Tool 定义 ==========

const CHAT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_travel_info',
      description: '查询旅行知识库。当用户询问城市、景点、美食、交通、旅行季节等信息时调用此工具。',
      parameters: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: '要查询的城市名称，如"杭州""北京"。如果用户没指定具体城市但提到了景点名，填写景点所在城市。',
          },
          query: {
            type: 'string',
            description: '用户的具体查询内容，用于语义检索。如"适合情侣的景点""当地特色美食"。',
          },
        },
        required: ['city'],
      },
    },
  },
]

// ========== Tool 执行 ==========

/**
 * 执行 search_travel_info 工具
 * @param {object} args - { city, query? }
 * @returns {string} JSON 格式的知识库检索结果
 */
function executeSearchTool(args) {
  const { city, query } = args
  const result = retrieve(city, [], query || city)
  if (!result) {
    // 尝试在所有城市中搜索景点名
    const attractionsDB = require('../knowledge/attractions.json')
    for (const cityData of attractionsDB) {
      const found = cityData.attractions.find(a => (query || '').includes(a.name) || city.includes(a.name))
      if (found) {
        const cityResult = retrieve(cityData.city, [], query || city)
        if (cityResult) {
          return JSON.stringify({
            city: cityData.city,
            attractions: cityResult.attractions.slice(0, 8).map(a => ({
              name: a.name, description: a.description, ticket: a.ticket, duration: a.duration,
            })),
            food: cityResult.food,
            transport: cityResult.transport,
            bestSeason: cityResult.bestSeason,
          })
        }
      }
    }
    return JSON.stringify({ error: `未找到"${city}"的旅行信息，该城市可能不在我们的知识库中。` })
  }

  return JSON.stringify({
    city: result.city,
    attractions: result.attractions.slice(0, 8).map(a => ({
      name: a.name, description: a.description, ticket: a.ticket, duration: a.duration,
    })),
    food: result.food,
    transport: result.transport,
    bestSeason: result.bestSeason,
  })
}

// ========== Chat Agent 主流程 ==========

router.post('/chat', async (req, res) => {
  try {
    initSSE(res)

    const { message } = req.body
    if (!message) {
      sendError(res, '请输入你的问题')
      res.end()
      return
    }

    // 收集 RAG 引用来源
    let ragSources = []

    // 尝试 Agent 模式（LLM + function calling）
    const config = getLLMConfig()
    if (config) {
      try {
        const messages = [
          { role: 'system', content: CHAT_SYSTEM_PROMPT },
          { role: 'user', content: message },
        ]

        // ReAct 循环：LLM 自主决定是否调用工具
        for (let round = 0; round < 5; round++) {
          const assistantMsg = await callLLMWithTools(messages, CHAT_TOOLS)

          if (!assistantMsg) break

          messages.push(assistantMsg)

          // 没有 tool_calls → LLM 已生成最终答案
          if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
            break
          }

          // 执行所有 tool calls
          for (const toolCall of assistantMsg.tool_calls) {
            let args = {}
            try { args = JSON.parse(toolCall.function.arguments) } catch { /* 空 */ }

            const toolResult = executeSearchTool(args)

            // 提取 RAG 来源
            try {
              const parsed = JSON.parse(toolResult)
              if (parsed.attractions) {
                ragSources = parsed.attractions.map(a => a.name)
              }
            } catch { /* 忽略 */ }

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            })
          }
        }

        // LLM 已在循环中生成了最终答案（最后一条 assistant 消息）
        const finalMsg = messages.filter(m => m.role === 'assistant').pop()
        const finalContent = finalMsg?.content || ''

        if (finalContent) {
          // 流式发送最终答案
          for (let i = 0; i < finalContent.length; i++) {
            sendSSE(res, { type: 'chunk', content: finalContent[i] })
            if (finalContent[i] === '\n' || i % 5 === 0) {
              await delay(15)
            }
          }

          sendSSE(res, { type: 'complete', data: { content: finalContent, sources: ragSources } })
          res.end()
          return
        }
      }
      catch (err) {
        console.error('Chat Agent 失败，降级到 Mock:', err.message)
      }
    }

    // ========== Mock 降级 ==========
    let ragResult = null
    const cities = getAllCities()

    // 城市名匹配
    for (const city of cities) {
      if (message.includes(city)) {
        const result = retrieve(city, [], city)
        if (result) {
          ragResult = { ...result, city }
          ragSources = result.attractions.slice(0, 5).map(a => a.name)
          break
        }
      }
    }

    // 景点名匹配
    if (!ragResult) {
      const attractionsDB = require('../knowledge/attractions.json')
      for (const cityData of attractionsDB) {
        const found = cityData.attractions.find(a => message.includes(a.name))
        if (found) {
          const result = retrieve(cityData.city, [], message)
          ragResult = { ...result, city: cityData.city }
          ragSources = [found.name, ...result.attractions.filter(a => a.name !== found.name).slice(0, 4).map(a => a.name)]
          break
        }
      }
    }

    const mockReply = getMockResponse(message, ragResult)
    let accumulated = ''
    for (const char of mockReply) {
      accumulated += char
      sendSSE(res, { type: 'chunk', content: char })
      if (char === '\n' || accumulated.length % 5 === 0) {
        await delay(20)
      }
    }

    sendSSE(res, { type: 'complete', data: { content: mockReply, sources: ragSources } })
  }
  catch (err) {
    console.error('对话失败:', err)
    sendError(res, '处理消息时出现错误，请稍后重试')
  }
  finally {
    res.end()
  }
})

// ========== Mock 回复 ==========

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

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = router
