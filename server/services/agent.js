/**
 * AI Agent 编排器（ReAct 模式）
 * 通过 LLM function calling 实现多步骤行程规划
 * 无 API key 时降级为 Mock 模式
 */

import attractionsDB from '../knowledge/attractions.json' with { type: 'json' }
import { sendSSE } from '../utils/sse.js'
import { callLLMWithTools, getLLMConfig } from './llm.js'
import { retrieve } from './rag.js'
import { getDressAdvice, getWeather, isGoodForOutdoor } from './weather.js'

// ========== Agent System Prompt ==========

const AGENT_SYSTEM_PROMPT = `你是一个专业的旅行规划 Agent。你的任务是为用户规划完整的旅行行程。

你有以下工具，必须按顺序依次调用：

1. parse_intent — 分析用户的旅行需求，提取城市、天数、预算和偏好
2. search_attractions — 根据城市和偏好检索景点知识库
3. check_weather — 查询目的地实时天气和未来预报
4. plan_itinerary — 根据景点数据和天气情况规划每日行程（上午、下午、晚上各一个景点）
5. calculate_budget — 根据总预算和行程计算费用明细
6. generate_tips — 根据城市特点、天气和行程生成个性化旅行建议

重要规则：
- 每个工具恰好调用一次，不要跳过任何工具
- check_weather 必须在 plan_itinerary 之前调用，天气影响景点选择
- 雨天/极端天气优先推荐室内景点（indoor=true），晴天优先推荐户外景点
- plan_itinerary 的输出必须是严格 JSON 格式的 DayItinerary 数组
- 每个 SpotData 必须包含 spot、description、duration、ticket、transportation 字段
- 每天 evening 字段应包含餐饮推荐信息
- 最终用中文回答`

// ========== Tool 定义 ==========

const AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'parse_intent',
      description: '解析用户的旅行需求，提取城市、天数、预算和偏好标签',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '目的地城市' },
          days: { type: 'integer', description: '行程天数（1-10）' },
          budget: { type: 'integer', description: '总预算（元）' },
          tags: { type: 'array', items: { type: 'string' }, description: '偏好标签，如"必去""文化""美食""自然""娱乐"' },
        },
        required: ['city', 'days', 'budget', 'tags'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_attractions',
      description: '根据城市和偏好标签检索景点知识库，返回景点、美食、交通等信息',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
          tags: { type: 'array', items: { type: 'string' }, description: '偏好标签' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'check_weather',
      description: '查询目的地城市的实时天气和未来几天预报，用于规划行程时参考',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
          days: { type: 'integer', description: '行程天数' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'plan_itinerary',
      description: '根据景点数据和天气情况规划每日行程，输出 JSON 格式的 DayItinerary 数组',
      parameters: {
        type: 'object',
        properties: {
          itinerary: {
            type: 'array',
            description: '每日行程数组',
            items: {
              type: 'object',
              properties: {
                day: { type: 'integer' },
                date: { type: 'string' },
                morning: {
                  type: 'object',
                  properties: {
                    spot: { type: 'string' },
                    description: { type: 'string' },
                    duration: { type: 'string' },
                    ticket: { type: 'string' },
                    transportation: { type: 'string' },
                  },
                  required: ['spot', 'description', 'duration', 'ticket', 'transportation'],
                },
                afternoon: {
                  type: 'object',
                  properties: {
                    spot: { type: 'string' },
                    description: { type: 'string' },
                    duration: { type: 'string' },
                    ticket: { type: 'string' },
                    transportation: { type: 'string' },
                  },
                  required: ['spot', 'description', 'duration', 'ticket', 'transportation'],
                },
                evening: {
                  type: 'object',
                  properties: {
                    spot: { type: 'string' },
                    description: { type: 'string' },
                    duration: { type: 'string' },
                    ticket: { type: 'string' },
                    transportation: { type: 'string' },
                  },
                  required: ['spot', 'description', 'duration', 'ticket', 'transportation'],
                },
              },
              required: ['day', 'date', 'morning', 'afternoon', 'evening'],
            },
          },
        },
        required: ['itinerary'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'calculate_budget',
      description: '根据总预算和行程天数计算费用明细（住宿、餐饮、交通、门票、其他）',
      parameters: {
        type: 'object',
        properties: {
          totalBudget: { type: 'integer', description: '总预算（元）' },
          days: { type: 'integer', description: '行程天数' },
          ticketCost: { type: 'integer', description: '门票总费用（元）' },
        },
        required: ['totalBudget', 'days', 'ticketCost'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_tips',
      description: '根据城市、天气和行程生成个性化旅行建议列表',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '城市名称' },
          days: { type: 'integer', description: '行程天数' },
          bestSeason: { type: 'string', description: '最佳旅行季节' },
          food: { type: 'array', items: { type: 'string' }, description: '推荐美食' },
          transport: { type: 'string', description: '交通方式' },
        },
        required: ['city', 'days', 'bestSeason', 'food', 'transport'],
      },
    },
  },
]

// ========== Tool 执行函数 ==========

function executeTool(toolName, args, context) {
  switch (toolName) {
    case 'parse_intent': {
      const intent = {
        city: args.city || '北京',
        days: Math.max(1, Math.min(Number(args.days) || 3, 10)),
        budget: Math.max(1000, Number(args.budget) || 5000),
        tags: args.tags || ['必去'],
      }
      context.intent = intent
      return {
        output: JSON.stringify(intent),
        summary: { city: intent.city, days: intent.days, budget: intent.budget, tags: intent.tags },
      }
    }

    case 'search_attractions': {
      const city = args.city || context.intent?.city || '北京'
      const tags = args.tags || context.intent?.tags || []
      const ragResult = retrieve(city, tags, city)
      if (!ragResult) {
        context.ragResult = null
        return { output: `未找到城市"${city}"的景点数据`, summary: { count: 0, sources: [] } }
      }
      context.ragResult = ragResult
      const sources = ragResult.attractions.slice(0, 5).map(a => a.name)
      const output = JSON.stringify({
        city: ragResult.city,
        attractions: ragResult.attractions.map(a => ({
          name: a.name,
          description: a.description,
          duration: a.duration,
          ticket: a.ticket,
          tags: a.tags,
          indoor: a.indoor || false,
        })),
        food: ragResult.food,
        transport: ragResult.transport,
        bestSeason: ragResult.bestSeason,
      })
      return { output, summary: { count: ragResult.attractions.length, sources } }
    }

    case 'check_weather': {
      // 天气查询是异步的，但 executeTool 是同步的
      // 实际天气数据在 Mock 流程中通过 async 处理
      // LLM 模式下，天气数据已经预先获取并存入 context
      const weather = context.weather
      if (!weather) {
        return { output: JSON.stringify({ error: '天气数据暂不可用' }), summary: {} }
      }
      return {
        output: JSON.stringify(weather),
        summary: {
          city: weather.city,
          temperature: weather.temperature,
          weatherDesc: weather.weatherDesc,
          forecastCount: weather.forecast?.length || 0,
        },
      }
    }

    case 'plan_itinerary': {
      const itinerary = args.itinerary || []
      context.itinerary = itinerary
      return {
        output: JSON.stringify(itinerary),
        summary: { days: itinerary.length, spotCount: itinerary.length * 3 },
      }
    }

    case 'calculate_budget': {
      const totalBudget = args.totalBudget || context.intent?.budget || 5000
      const ticketCost = args.ticketCost || 0
      const budgetBreakdown = {
        accommodation: Math.round(totalBudget * 0.35),
        food: Math.round(totalBudget * 0.25),
        transportation: Math.round(totalBudget * 0.15),
        tickets: Math.min(ticketCost, Math.round(totalBudget * 0.15)),
      }
      budgetBreakdown.other = totalBudget - budgetBreakdown.accommodation - budgetBreakdown.food - budgetBreakdown.transportation - budgetBreakdown.tickets
      context.budgetBreakdown = budgetBreakdown
      return { output: JSON.stringify(budgetBreakdown), summary: budgetBreakdown }
    }

    case 'generate_tips': {
      const tips = []
      const weather = context.weather
      if (weather) {
        tips.push(`当前天气：${weather.weatherDesc}，${weather.temperature}°C`)
        tips.push(...getDressAdvice(weather))
      }
      if (args.bestSeason)
        tips.push(`最佳旅行季节：${args.bestSeason}`)
      if (args.transport)
        tips.push(`交通建议：${args.transport}`)
      if (args.food?.length)
        tips.push(`推荐美食：${args.food.slice(0, 5).join('、')}`)
      if (args.days >= 3)
        tips.push('行程较长，建议准备舒适的运动鞋')
      tips.push('建议提前在网上预约热门景点门票')
      context.tips = tips
      return { output: JSON.stringify(tips), summary: { count: tips.length } }
    }

    default:
      return { output: `未知工具: ${toolName}`, summary: {} }
  }
}

// ========== Step 映射 ==========

const STEP_MAP = {
  parse_intent: 1,
  search_attractions: 2,
  check_weather: 3,
  plan_itinerary: 4,
  calculate_budget: 5,
  generate_tips: 6,
}

const STEP_NAMES = {
  1: '解析意图',
  2: '知识库检索',
  3: '查询天气',
  4: '行程规划',
  5: '预算计算',
  6: '生成建议',
}

// ========== Agent 主流程 ==========

async function executeAgent(res, params) {
  const config = getLLMConfig()

  if (!config) {
    return executeAgentMock(res, params)
  }

  // 预获取天气数据（供 LLM 和 fallback 使用）
  const weather = await getWeather(params.city).catch(() => null)

  const context = { weather }
  const messages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: `请为以下旅行需求规划行程：城市=${params.city}，天数=${params.days}，预算=${params.budget}元` },
  ]

  try {
    for (let round = 0; round < 10; round++) {
      const assistantMsg = await callLLMWithTools(messages, AGENT_TOOLS)

      if (!assistantMsg) {
        return executeAgentMock(res, params)
      }

      messages.push(assistantMsg)

      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        break
      }

      for (const toolCall of assistantMsg.tool_calls) {
        const { name, arguments: argsStr } = toolCall.function
        let args = {}
        try {
          args = JSON.parse(argsStr)
        }
        catch { /* 空参数 */ }

        const stepNum = STEP_MAP[name]
        if (stepNum) {
          sendSSE(res, { type: 'step', step: stepNum, name: STEP_NAMES[stepNum], status: 'start' })
        }

        const result = executeTool(name, args, context)

        if (stepNum) {
          sendSSE(res, { type: 'step', step: stepNum, name: STEP_NAMES[stepNum], status: 'complete', data: result.summary })
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result.output,
        })
      }
    }

    // 补执行缺失步骤
    if (!context.intent) {
      sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'start' })
      const result = executeTool('parse_intent', params, context)
      sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'complete', data: result.summary })
    }
    if (!context.ragResult) {
      sendSSE(res, { type: 'step', step: 2, name: '知识库检索', status: 'start' })
      const result = executeTool('search_attractions', { city: context.intent?.city || params.city }, context)
      sendSSE(res, { type: 'step', step: 2, name: '知识库检索', status: 'complete', data: result.summary })
    }
    if (!context.weather) {
      sendSSE(res, { type: 'step', step: 3, name: '查询天气', status: 'start' })
      context.weather = await getWeather(params.city).catch(() => null)
      sendSSE(res, { type: 'step', step: 3, name: '查询天气', status: 'complete', data: context.weather ? { temperature: context.weather.temperature, weatherDesc: context.weather.weatherDesc } : {} })
    }

    if (!context.itinerary || !context.itinerary.length) {
      sendSSE(res, { type: 'step', step: 4, name: '行程规划', status: 'start' })
      const itinerary = buildWeatherAwareItinerary(context)
      context.itinerary = itinerary
      sendSSE(res, { type: 'step', step: 4, name: '行程规划', status: 'complete', data: { days: itinerary.length, spotCount: itinerary.length * 3 } })
    }

    if (!context.budgetBreakdown) {
      sendSSE(res, { type: 'step', step: 5, name: '预算计算', status: 'start' })
      const result = executeTool('calculate_budget', {
        totalBudget: context.intent?.budget || params.budget,
        days: context.intent?.days || params.days,
        ticketCost: (context.ragResult?.attractions || []).slice(0, (context.intent?.days || params.days) * 3).reduce((s, a) => s + (a.ticket || 0), 0),
      }, context)
      sendSSE(res, { type: 'step', step: 5, name: '预算计算', status: 'complete', data: result.summary })
    }

    if (!context.tips) {
      sendSSE(res, { type: 'step', step: 6, name: '生成建议', status: 'start' })
      const cityData = context.ragResult || {}
      const result = executeTool('generate_tips', {
        city: context.intent?.city || params.city,
        days: context.intent?.days || params.days,
        bestSeason: cityData.bestSeason || '春秋两季',
        food: cityData.food || [],
        transport: cityData.transport || '公共交通',
      }, context)
      sendSSE(res, { type: 'step', step: 6, name: '生成建议', status: 'complete', data: result.summary })
    }

    // 获取住宿和夜生活数据
    const cityData = attractionsDB.find(c => c.city === (context.intent?.city || params.city))

    sendSSE(res, {
      type: 'complete',
      data: {
        city: context.intent?.city || params.city,
        days: context.intent?.days || params.days,
        totalBudget: context.intent?.budget || params.budget,
        dailyItinerary: context.itinerary,
        budgetBreakdown: context.budgetBreakdown,
        tips: context.tips || [],
        weather: context.weather || null,
        accommodation: cityData?.accommodation || [],
        nightlife: cityData?.nightlife || [],
      },
    })
  }
  catch (err) {
    console.error('Agent 执行失败，降级到 Mock:', err.message)
    return executeAgentMock(res, params)
  }
}

// ========== 天气感知行程构建 ==========

/**
 * 根据天气智能规划行程
 * 雨天/极端天气优先室内景点，晴天优先户外景点
 * 晚间加入餐饮推荐
 */
function buildWeatherAwareItinerary(context) {
  const days = context.intent?.days || 3
  const ragResult = context.ragResult
  const weather = context.weather

  if (!ragResult || !ragResult.attractions.length)
    return []

  const allSpots = ragResult.attractions
  const goodOutdoor = isGoodForOutdoor(weather)

  // 根据天气筛选景点排序
  let sortedSpots
  if (goodOutdoor) {
    // 晴天：户外优先，室内穿插
    const outdoor = allSpots.filter(a => !a.indoor)
    const indoor = allSpots.filter(a => a.indoor)
    sortedSpots = [...outdoor, ...indoor]
  }
  else {
    // 雨天/极端天气：室内优先
    const indoor = allSpots.filter(a => a.indoor)
    const outdoor = allSpots.filter(a => !a.indoor)
    sortedSpots = [...indoor, ...outdoor]
  }

  // 如果筛选后景点不足，回退到原始列表
  if (sortedSpots.length < days * 2) {
    sortedSpots = allSpots
  }

  const foodList = ragResult.food || []
  const itinerary = []

  for (let d = 1; d <= days; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d - 1)
    const dateStr = date.toISOString().split('T')[0]

    const morningSpot = sortedSpots[(d - 1) * 3] || sortedSpots[0]
    const afternoonSpot = sortedSpots[(d - 1) * 3 + 1] || sortedSpots[1] || sortedSpots[0]
    const eveningSpot = sortedSpots[(d - 1) * 3 + 2] || sortedSpots[2] || sortedSpots[0]

    // 晚间：景点 + 餐饮推荐
    const foodRec = foodList[(d - 1) % foodList.length]
    const eveningFormatted = formatSpot(eveningSpot)
    if (foodRec) {
      eveningFormatted.description += `。晚餐推荐品尝当地特色：${foodRec}`
    }

    itinerary.push({
      day: d,
      date: dateStr,
      morning: formatSpot(morningSpot),
      afternoon: formatSpot(afternoonSpot),
      evening: eveningFormatted,
    })
  }

  return itinerary
}

// ========== 辅助函数 ==========

function formatSpot(spot) {
  if (!spot)
    return { spot: '自由活动', description: '可在周边闲逛休息', duration: '1-2小时', ticket: '免费', transportation: '步行' }
  return {
    spot: spot.name,
    description: spot.description,
    duration: spot.duration || '2-3小时',
    ticket: spot.ticket === 0 ? '免费' : `¥${spot.ticket}`,
    transportation: spot.transportation || '公共交通可达',
  }
}

// ========== Mock 降级 ==========

async function executeAgentMock(res, params) {
  // 步骤 1：解析意图
  sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'start' })
  const tags = []
  if (params.budget <= 2000)
    tags.push('免费', '文化')
  else if (params.budget <= 5000)
    tags.push('必去', '文化', '美食')
  else tags.push('必去', '娱乐', '自然')
  const intent = {
    city: params.city || '北京',
    days: Math.max(1, Math.min(Number(params.days) || 3, 10)),
    budget: Math.max(1000, Number(params.budget) || 5000),
    tags,
  }
  sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'complete', data: { city: intent.city, days: intent.days, budget: intent.budget, tags: intent.tags } })

  // 步骤 2：检索景点
  sendSSE(res, { type: 'step', step: 2, name: '知识库检索', status: 'start' })
  const ragResult = retrieve(intent.city, intent.tags, intent.city)
  if (!ragResult) {
    sendSSE(res, { type: 'complete', data: { dailyItinerary: [], budgetBreakdown: null, tips: ['暂不支持该城市的行程规划'] } })
    return
  }
  sendSSE(res, { type: 'step', step: 2, name: '知识库检索', status: 'complete', data: { count: ragResult.attractions.length, sources: ragResult.attractions.slice(0, 5).map(a => a.name) } })

  // 步骤 3：查询天气
  sendSSE(res, { type: 'step', step: 3, name: '查询天气', status: 'start' })
  const weather = await getWeather(intent.city).catch(() => null)
  sendSSE(res, { type: 'step', step: 3, name: '查询天气', status: 'complete', data: weather ? { temperature: weather.temperature, weatherDesc: weather.weatherDesc } : {} })

  // 步骤 4：天气感知行程规划
  sendSSE(res, { type: 'step', step: 4, name: '行程规划', status: 'start' })
  const goodOutdoor = isGoodForOutdoor(weather)
  let sortedSpots
  if (goodOutdoor) {
    const outdoor = ragResult.attractions.filter(a => !a.indoor)
    const indoor = ragResult.attractions.filter(a => a.indoor)
    sortedSpots = [...outdoor, ...indoor]
  }
  else {
    const indoor = ragResult.attractions.filter(a => a.indoor)
    const outdoor = ragResult.attractions.filter(a => !a.indoor)
    sortedSpots = [...indoor, ...outdoor]
  }
  if (sortedSpots.length < intent.days * 2)
    sortedSpots = ragResult.attractions

  const foodList = ragResult.food || []
  const itinerary = []
  for (let d = 1; d <= intent.days; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d - 1)
    const eveningFormatted = formatSpot(sortedSpots[(d - 1) * 3 + 2] || sortedSpots[2] || sortedSpots[0])
    const foodRec = foodList[(d - 1) % foodList.length]
    if (foodRec)
      eveningFormatted.description += `。晚餐推荐品尝当地特色：${foodRec}`

    itinerary.push({
      day: d,
      date: date.toISOString().split('T')[0],
      morning: formatSpot(sortedSpots[(d - 1) * 3] || sortedSpots[0]),
      afternoon: formatSpot(sortedSpots[(d - 1) * 3 + 1] || sortedSpots[1] || sortedSpots[0]),
      evening: eveningFormatted,
    })
  }
  sendSSE(res, { type: 'step', step: 4, name: '行程规划', status: 'complete', data: { days: intent.days, spotCount: intent.days * 3 } })

  // 步骤 5：计算预算
  sendSSE(res, { type: 'step', step: 5, name: '预算计算', status: 'start' })
  const ticketCost = sortedSpots.slice(0, intent.days * 3).reduce((sum, a) => sum + (a.ticket || 0), 0)
  const budgetBreakdown = {
    accommodation: Math.round(intent.budget * 0.35),
    food: Math.round(intent.budget * 0.25),
    transportation: Math.round(intent.budget * 0.15),
    tickets: Math.min(ticketCost, Math.round(intent.budget * 0.15)),
  }
  budgetBreakdown.other = intent.budget - budgetBreakdown.accommodation - budgetBreakdown.food - budgetBreakdown.transportation - budgetBreakdown.tickets
  sendSSE(res, { type: 'step', step: 5, name: '预算计算', status: 'complete', data: budgetBreakdown })

  // 步骤 6：生成建议（含天气建议）
  sendSSE(res, { type: 'step', step: 6, name: '生成建议', status: 'start' })
  const tips = []
  if (weather) {
    tips.push(`当前天气：${weather.weatherDesc}，${weather.temperature}°C`)
    tips.push(...getDressAdvice(weather))
  }
  tips.push(`最佳旅行季节：${ragResult.bestSeason}`)
  tips.push(`交通建议：${ragResult.transport}`)
  if (ragResult.food?.length)
    tips.push(`推荐美食：${ragResult.food.slice(0, 5).join('、')}`)
  if (intent.days >= 3)
    tips.push('行程较长，建议准备舒适的运动鞋')
  tips.push('建议提前在网上预约热门景点门票')
  sendSSE(res, { type: 'step', step: 6, name: '生成建议', status: 'complete', data: { count: tips.length } })

  // 获取住宿和夜生活数据
  const cityData = attractionsDB.find(c => c.city === intent.city)

  // 发送最终结果
  sendSSE(res, {
    type: 'complete',
    data: {
      city: intent.city,
      days: intent.days,
      totalBudget: intent.budget,
      dailyItinerary: itinerary,
      budgetBreakdown,
      tips,
      weather: weather || null,
      accommodation: cityData?.accommodation || [],
      nightlife: cityData?.nightlife || [],
    },
  })
}

export { executeAgent }
