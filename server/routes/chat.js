/**
 * AI 对话路由（Agent 模式）
 * POST /api/travel/chat - 多工具 ReAct Agent + 对话历史 + Step 可视化
 */

import { Router } from 'express'
import { consumeAiQuotaForRequest } from '../middleware/aiQuota.js'
import { requireAuthForRequest } from '../middleware/auth.js'
import attractionsDB from '../knowledge/attractions.json' with { type: 'json' }
import { searchAttractions as searchProductAttractions } from '../services/attractions/attractionService.js'
import { callLLMWithTools, getLLMConfig } from '../services/llm.js'
import { getAllCities, retrieve } from '../services/rag.js'
import { asyncHandler } from '../utils/http.js'
import { initSSE, sendError, sendSSE } from '../utils/sse.js'
import { ensureArray, readRequiredString } from '../utils/validation.js'

const router = Router()

// ========== Chat Agent System Prompt ==========

const CHAT_SYSTEM_PROMPT = `你是一个专业的旅行顾问 AI 助手。你可以帮用户：
1. 推荐旅游城市和景点
2. 规划旅行行程
3. 推荐当地美食
4. 提供交通和旅行建议

你有以下工具，根据用户问题选择合适的工具调用：
- search_travel_info：查询城市、景点、美食、交通等详细信息。当用户询问具体城市或景点时必须调用。
- get_city_list：获取知识库中所有可查询的城市列表。当用户问"有哪些城市""推荐去哪里"时调用。
- compare_cities：对比两个城市的特点。当用户问"A和B哪个好""对比两个城市"时调用。
- search_product_attractions：查询产品景点库，返回可进入详情页、收藏和购票的景点。当用户询问免费景点、收费景点、亲子景点、夜游景点或购票信息时优先调用。
- get_travel_tips：获取城市旅行贴士和注意事项。当用户问"注意事项""带什么""tips"时调用。

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
  {
    type: 'function',
    function: {
      name: 'get_city_list',
      description: '获取知识库中所有可查询的城市列表。当用户问"有哪些城市""推荐去哪里""你能查哪些地方"时调用。',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_cities',
      description: '对比两个城市的旅行信息（景点数量、美食、最佳季节、交通）。当用户问"A和B哪个好""对比两个城市""选哪个城市"时调用。',
      parameters: {
        type: 'object',
        properties: {
          city_a: { type: 'string', description: '第一个城市名称' },
          city_b: { type: 'string', description: '第二个城市名称' },
        },
        required: ['city_a', 'city_b'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_travel_tips',
      description: '获取城市旅行贴士、注意事项、最佳旅行季节等实用信息。当用户问"注意事项""带什么""tips""什么时候去"时调用。',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_product_attractions',
      description: '查询产品景点库，支持城市、关键词、免费/收费和标签筛选，返回景点详情页入口。',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称，如北京、上海、杭州、成都、西安' },
          keyword: { type: 'string', description: '关键词，如景点名、熊猫、博物馆' },
          ticketType: { type: 'string', enum: ['free', 'paid'], description: 'free 表示免费，paid 表示收费' },
          tag: { type: 'string', description: '标签，如亲子、历史、夜游、自然' },
        },
      },
    },
  },
]

// ========== Step 事件映射 ==========

const CHAT_STEP_MAP = {
  search_travel_info: '查询知识库',
  get_city_list: '获取城市列表',
  compare_cities: '对比城市信息',
  get_travel_tips: '获取旅行贴士',
  search_product_attractions: '查询精选景点',
}

// ========== 工具执行 ==========

/**
 * 统一工具分发
 * @param {string} toolName - 工具名
 * @param {object} args - 工具参数
 * @returns {string} JSON 格式的结果
 */
function executeChatTool(toolName, args) {
  switch (toolName) {
    case 'search_travel_info':
      return executeSearchTool(args)
    case 'get_city_list':
      return executeGetCityList()
    case 'compare_cities':
      return executeCompareCities(args)
    case 'get_travel_tips':
      return executeGetTravelTips(args)
    case 'search_product_attractions':
      return executeProductAttractionsTool(args)
    default:
      return JSON.stringify({ error: `未知工具: ${toolName}` })
  }
}

function executeSearchTool(args) {
  const { city, query } = args
  const result = retrieve(city, [], query || city)
  if (!result) {
    for (const cityData of attractionsDB) {
      const found = cityData.attractions.find(a => (query || '').includes(a.name) || city.includes(a.name))
      if (found) {
        const cityResult = retrieve(cityData.city, [], query || city)
        if (cityResult) {
          return JSON.stringify({
            city: cityData.city,
            attractions: cityResult.attractions.slice(0, 8).map(a => ({
              name: a.name,
              description: a.description,
              ticket: a.ticket,
              duration: a.duration,
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
      name: a.name,
      description: a.description,
      ticket: a.ticket,
      duration: a.duration,
    })),
    food: result.food,
    transport: result.transport,
    bestSeason: result.bestSeason,
  })
}

function executeGetCityList() {
  const cities = getAllCities()
  return JSON.stringify({
    cities,
    total: cities.length,
    message: `知识库中共有 ${cities.length} 个城市可查询`,
  })
}

function executeCompareCities(args) {
  const { city_a, city_b } = args
  const dataA = retrieve(city_a, [], city_a)
  const dataB = retrieve(city_b, [], city_b)

  if (!dataA && !dataB) {
    return JSON.stringify({ error: `未找到"${city_a}"和"${city_b}"的旅行信息` })
  }
  if (!dataA)
    return JSON.stringify({ error: `未找到"${city_a}"的旅行信息` })
  if (!dataB)
    return JSON.stringify({ error: `未找到"${city_b}"的旅行信息` })

  return JSON.stringify({
    city_a: {
      city: dataA.city,
      attractionCount: dataA.attractions.length,
      topAttractions: dataA.attractions.slice(0, 3).map(a => a.name),
      food: dataA.food.slice(0, 3),
      bestSeason: dataA.bestSeason,
      transport: dataA.transport,
    },
    city_b: {
      city: dataB.city,
      attractionCount: dataB.attractions.length,
      topAttractions: dataB.attractions.slice(0, 3).map(a => a.name),
      food: dataB.food.slice(0, 3),
      bestSeason: dataB.bestSeason,
      transport: dataB.transport,
    },
  })
}

function executeGetTravelTips(args) {
  const { city } = args
  const result = retrieve(city, [], city)
  if (!result) {
    return JSON.stringify({ error: `未找到"${city}"的旅行信息` })
  }

  const tips = []
  if (result.bestSeason)
    tips.push(`最佳旅行季节：${result.bestSeason}`)
  if (result.transport)
    tips.push(`交通：${result.transport}`)
  if (result.food.length > 0)
    tips.push(`必吃美食：${result.food.slice(0, 5).join('、')}`)

  const cityData = attractionsDB.find(c => c.city === city)
  if (cityData) {
    for (const a of cityData.attractions.slice(0, 5)) {
      if (a.tips)
        tips.push(`${a.name}：${a.tips}`)
    }
  }

  return JSON.stringify({
    city: result.city,
    bestSeason: result.bestSeason,
    transport: result.transport,
    food: result.food,
    tips,
  })
}

function executeProductAttractionsTool(args) {
  const filters = {
    city: typeof args.city === 'string' ? args.city : '',
    keyword: typeof args.keyword === 'string' ? args.keyword : '',
    ticketType: ['free', 'paid'].includes(args.ticketType) ? args.ticketType : '',
    tag: typeof args.tag === 'string' ? args.tag : '',
  }
  const attractions = searchProductAttractions(filters).slice(0, 8).map(item => ({
    id: item.id,
    name: item.name,
    city: item.city,
    ticketType: item.ticketType,
    priceText: item.priceText,
    summary: item.summary,
    tags: item.tags,
    detailPath: `/attractions/${item.id}`,
  }))

  return JSON.stringify({
    city: filters.city || attractions[0]?.city || '',
    total: attractions.length,
    attractions,
    message: attractions.length ? '已找到精选景点' : '暂无符合条件的精选景点',
  })
}

// ========== 对话记忆 ==========

/**
 * 构建带记忆的消息列表（滑动窗口）
 * @param {object[]} historyMessages - 前端传来的历史消息
 * @param {string} currentMessage - 当前用户消息
 * @returns {object[]} 用于 LLM 的消息数组
 */
function buildMessagesWithMemory(historyMessages, currentMessage) {
  const systemMsg = { role: 'system', content: CHAT_SYSTEM_PROMPT }

  // 无历史或历史很短，直接用
  if (!historyMessages || historyMessages.length <= 6) {
    return [
      systemMsg,
      ...(historyMessages || []),
      { role: 'user', content: currentMessage },
    ]
  }

  // 旧消息提取摘要
  const oldMessages = historyMessages.slice(0, -6)
  const cities = getAllCities()
  const mentionedCities = new Set()
  const topics = []

  for (const msg of oldMessages) {
    if (msg.role === 'user' && msg.content) {
      for (const city of cities) {
        if (msg.content.includes(city))
          mentionedCities.add(city)
      }
    }
  }

  if (mentionedCities.size > 0) {
    topics.push(`讨论了${[...mentionedCities].join('、')}等城市`)
  }
  if (oldMessages.length > 0) {
    topics.push(`共 ${Math.floor(oldMessages.length / 2)} 轮对话`)
  }

  const summary = topics.length > 0
    ? `对话上下文：用户${topics.join('，')}。`
    : ''

  const recentMessages = historyMessages.slice(-6)

  return [
    systemMsg,
    ...(summary ? [{ role: 'system', content: summary }] : []),
    ...recentMessages,
    { role: 'user', content: currentMessage },
  ]
}

// ========== Chat Agent 主流程 ==========

router.post('/chat', asyncHandler(async (req, res) => {
  const message = readRequiredString(req.body.message, '问题', { min: 1, max: 2000 })
  const historyMessages = ensureArray(req.body.messages, '历史消息', { max: 20 }).map((item) => {
    const role = item?.role === 'assistant' ? 'assistant' : 'user'
    const content = typeof item?.content === 'string' ? item.content.slice(0, 2000) : ''
    return { role, content }
  }).filter(item => item.content)

  requireAuthForRequest(req)
  await consumeAiQuotaForRequest(req, res)

  try {
    initSSE(res)

    let ragSources = []

    // 尝试 Agent 模式（LLM + function calling）
    const config = getLLMConfig()
    if (config) {
      try {
        const messages = buildMessagesWithMemory(historyMessages, message)
        let stepCounter = 0

        // ReAct 循环：LLM 自主决定是否调用工具
        for (let round = 0; round < 5; round++) {
          const assistantMsg = await callLLMWithTools(messages, CHAT_TOOLS)

          if (!assistantMsg)
            break

          messages.push(assistantMsg)

          // 没有 tool_calls → LLM 已生成最终答案
          if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
            break
          }

          // 执行所有 tool calls
          for (const toolCall of assistantMsg.tool_calls) {
            const toolName = toolCall.function.name
            let args = {}
            try { args = JSON.parse(toolCall.function.arguments) }
            catch { /* 空 */ }

            stepCounter++
            const stepName = CHAT_STEP_MAP[toolName] || toolName

            // 发送 step start 事件
            sendSSE(res, { type: 'step', step: stepCounter, name: stepName, status: 'start' })

            const toolResult = executeChatTool(toolName, args)

            // 提取结果摘要
            let summary = {}
            try {
              const parsed = JSON.parse(toolResult)
              if (parsed.attractions) {
                ragSources = parsed.attractions.map(a => a.name)
                summary = { city: parsed.city, attractionCount: parsed.attractions.length }
              }
              else if (parsed.cities) {
                summary = { cityCount: parsed.total }
              }
              else if (parsed.city_a) {
                summary = { city_a: parsed.city_a.city, city_b: parsed.city_b.city }
              }
              else if (parsed.tips) {
                summary = { city: parsed.city, tipCount: parsed.tips.length }
              }
            }
            catch { /* 忽略 */ }

            // 发送 step complete 事件
            sendSSE(res, { type: 'step', step: stepCounter, name: stepName, status: 'complete', data: summary })

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: toolResult,
            })
          }
        }

        // 最终答案
        const finalMsg = messages.filter(m => m.role === 'assistant').pop()
        const finalContent = finalMsg?.content || ''

        if (finalContent) {
          for (let i = 0; i < finalContent.length; i++) {
            sendSSE(res, { type: 'chunk', content: finalContent[i] })
            if (finalContent[i] === '\n' || i % 5 === 0) {
              await delay(15)
            }
          }

          sendSSE(res, { type: 'complete', data: { content: finalContent, sources: ragSources } })
          return
        }
      }
      catch (err) {
        console.error('Chat Agent 失败，降级到 Mock:', err.message)
        sendSSE(res, { type: 'notice', message: 'AI 模型暂不可用，已切换为知识库模式' })
      }
    }

    // ========== Mock 降级 ==========
    let ragResult = null
    const cities = getAllCities()
    let stepCounter = 0

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

    // Mock 模式也发送 step 事件
    if (ragResult) {
      stepCounter++
      sendSSE(res, { type: 'step', step: stepCounter, name: '查询知识库', status: 'start' })
      await delay(100)
      sendSSE(res, { type: 'step', step: stepCounter, name: '查询知识库', status: 'complete', data: { city: ragResult.city, attractionCount: ragResult.attractions.length } })
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
}))

// ========== Mock 回复 ==========

function getMockResponse(message, ragResult) {
  if (ragResult) {
    const { attractions, food, bestSeason, transport } = ragResult
    const city = ragResult.city || '该城市'
    const isFood = /美食|吃|餐厅|小吃/.test(message)
    const isTransport = /交通|怎么去|怎么走|机场|高铁|火车站/.test(message)
    const isPlan = /[天日玩]|行程|预算|规划|攻略/.test(message) || (/去/.test(message) && !/^去\S{2,4}$/.test(message.trim()))
    const allCitySpots = attractionsDB.find(c => c.city === city)?.attractions || []
    const isSpecificSpot = allCitySpots.find(a => message.includes(a.name))

    if (isSpecificSpot) {
      return `**${isSpecificSpot.name}**\n\n${isSpecificSpot.description || ''}\n\n门票：${isSpecificSpot.ticket ? `${isSpecificSpot.ticket}元` : '免费'}\n开放时间：${isSpecificSpot.openTime || '全天'}\n建议游玩时长：${isSpecificSpot.duration || '2-3小时'}\n交通：${isSpecificSpot.transportation || '公共交通可达'}\n\n建议提前规划好行程，避免高峰期。`
    }
    if (isFood) {
      return `${city}特色美食推荐：\n\n${food.map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\n建议去当地人常去的老店品尝，味道更正宗。`
    }
    if (isTransport) {
      return `${city}交通指南：\n\n${transport || '建议乘坐公共交通，方便快捷。景区之间可乘坐地铁或公交。'}\n\n最佳旅行季节：${bestSeason || '春秋两季'}。`
    }
    if (isPlan) {
      const days = message.match(/(\d)\s*[天日]/)?.[1]
      const budget = message.match(/(\d+)\s*([元块¥￥])/)?.[1]
      const dayText = days ? `${days}天` : '3天'
      const spotList = attractions.slice(0, days ? Number(days) * 2 : 6)
      return `为您规划${city}${dayText}行程：\n\n${spotList.map((a, i) => `**第${Math.floor(i / 2) + 1}${i % 2 === 0 ? '上午' : '下午'}** — ${a.name}（${a.duration || '2-3小时'}）`).join('\n')}\n\n推荐美食：${food.slice(0, 3).join('、')}${budget ? `\n预算参考：${budget}元足够${dayText}深度游` : ''}\n最佳季节：${bestSeason || '春秋两季'}。\n\n想要更详细的行程安排，可以使用首页的「行程规划」功能！`
    }
    const topSpots = attractions.slice(0, 5)
    return `${city}热门景点推荐：\n\n${topSpots.map((a, i) => `${i + 1}. **${a.name}** — ${a.description || ''}${a.ticket && a.ticket !== 0 ? `（门票${a.ticket}元）` : '（免费）'}`).join('\n')}\n\n推荐美食：${food.slice(0, 3).join('、')}。\n最佳季节：${bestSeason || '春秋两季'}。\n\n需要更详细的行程规划吗？`
  }

  // 无 RAG 结果的通用回复
  if (/有哪些城市|城市列表|能查/.test(message)) {
    const cities = getAllCities()
    return `知识库中可查询的城市：\n\n${cities.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n共 ${cities.length} 个城市，告诉我你想了解哪个城市吧！`
  }

  if (message.includes('保险')) {
    return '旅行保险购买建议：\n\n1. 选择包含意外医疗和紧急救援的保险\n2. 注意保障范围是否覆盖目的地\n3. 高风险活动需要额外保障\n4. 建议在出发前至少一天购买\n\n推荐平台：支付宝、携程、慧择等。'
  }

  return '你好！我是你的 AI 旅行顾问，可以帮你：\n\n1. 规划旅行行程\n2. 推荐当地景点和美食\n3. 提供旅行攻略和建议\n4. 解答旅行相关问题\n\n请告诉我你想去哪里旅行，我来帮你规划！'
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default router

export { executeChatTool as executeChatToolForTest }
