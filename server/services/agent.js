/**
 * AI Agent 编排器（ReAct 模式）
 * 通过 LLM function calling 实现多步骤行程规划
 * 无 API key 时降级为 Mock 模式
 */

const { retrieve } = require('./rag')
const { sendSSE } = require('../utils/sse')
const { callLLMWithTools, getLLMConfig } = require('./llm')

// ========== Agent System Prompt ==========

const AGENT_SYSTEM_PROMPT = `你是一个专业的旅行规划 Agent。你的任务是为用户规划完整的旅行行程。

你有以下工具，必须按顺序依次调用：

1. parse_intent — 分析用户的旅行需求，提取城市、天数、预算和偏好
2. search_attractions — 根据城市和偏好检索景点知识库
3. plan_itinerary — 根据检索到的景点数据规划每日行程（上午、下午、晚上各一个景点）
4. calculate_budget — 根据总预算和行程计算费用明细
5. generate_tips — 根据城市特点和行程生成个性化旅行建议

重要规则：
- 每个工具恰好调用一次，不要跳过任何工具
- plan_itinerary 的输出必须是严格 JSON 格式的 DayItinerary 数组
- 每个 SpotData 必须包含 spot、description、duration、ticket、transportation 字段
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
      name: 'plan_itinerary',
      description: '根据景点数据规划每日行程，输出 JSON 格式的 DayItinerary 数组',
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
      description: '根据城市和行程生成个性化旅行建议列表',
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

/**
 * 执行工具并返回结果
 * @param {string} toolName - 工具名称
 * @param {object} args - 工具参数
 * @param {object} context - Agent 上下文（共享状态）
 * @returns {{ output: string, summary: object }}
 */
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
        })),
        food: ragResult.food,
        transport: ragResult.transport,
        bestSeason: ragResult.bestSeason,
      })
      return { output, summary: { count: ragResult.attractions.length, sources } }
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
      if (args.bestSeason) tips.push(`最佳旅行季节：${args.bestSeason}`)
      if (args.transport) tips.push(`交通建议：${args.transport}`)
      if (args.food?.length) tips.push(`推荐美食：${args.food.slice(0, 5).join('、')}`)
      if (args.days >= 3) tips.push('行程较长，建议准备舒适的运动鞋')
      tips.push('建议提前在网上预约热门景点门票')
      tips.push('出行前查看当地天气预报，合理安排行程')
      context.tips = tips
      return { output: JSON.stringify(tips), summary: { count: tips.length } }
    }

    default:
      return { output: `未知工具: ${toolName}`, summary: {} }
  }
}

// ========== LLM 调用（带 tools） ==========

// ========== Agent 主流程 ==========

const STEP_MAP = {
  parse_intent: 1,
  search_attractions: 2,
  plan_itinerary: 3,
  calculate_budget: 4,
  generate_tips: 5,
}

const STEP_NAMES = {
  1: '解析意图',
  2: '知识库检索',
  3: '行程规划',
  4: '预算计算',
  5: '生成建议',
}

/**
 * 执行 Agent（ReAct 模式）
 * @param {import('express').Response} res - SSE 响应对象
 * @param {object} params - { city, budget, days }
 */
async function executeAgent(res, params) {
  const config = getLLMConfig()

  // 无 API key 时使用 Mock 模式
  if (!config) {
    return executeAgentMock(res, params)
  }

  const context = {}
  const messages = [
    { role: 'system', content: AGENT_SYSTEM_PROMPT },
    { role: 'user', content: `请为以下旅行需求规划行程：城市=${params.city}，天数=${params.days}，预算=${params.budget}元` },
  ]

  try {
    // ReAct 循环：LLM 决定调用哪些工具
    for (let round = 0; round < 10; round++) {
      const assistantMsg = await callLLMWithTools(messages, AGENT_TOOLS)

      if (!assistantMsg) {
        // LLM 无响应，降级到 Mock
        return executeAgentMock(res, params)
      }

      messages.push(assistantMsg)

      // 没有 tool_calls → LLM 已生成最终答案
      if (!assistantMsg.tool_calls || assistantMsg.tool_calls.length === 0) {
        break
      }

      // 执行所有 tool calls
      for (const toolCall of assistantMsg.tool_calls) {
        const { name, arguments: argsStr } = toolCall.function
        let args = {}
        try { args = JSON.parse(argsStr) } catch { /* 空参数 */ }

        const stepNum = STEP_MAP[name]
        if (stepNum) {
          sendSSE(res, { type: 'step', step: stepNum, name: STEP_NAMES[stepNum], status: 'start' })
        }

        const result = executeTool(name, args, context)

        if (stepNum) {
          sendSSE(res, { type: 'step', step: stepNum, name: STEP_NAMES[stepNum], status: 'complete', data: result.summary })
        }

        // 将工具结果加入消息历史
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result.output,
        })
      }
    }

    // 如果关键步骤缺失，补执行
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

    // 如果没有行程数据（LLM 未调用 plan_itinerary 或格式不对），用 RAG 数据生成
    if (!context.itinerary || !context.itinerary.length) {
      sendSSE(res, { type: 'step', step: 3, name: '行程规划', status: 'start' })
      const days = context.intent?.days || params.days || 3
      const attractions = context.ragResult?.attractions || []
      const itinerary = []
      for (let d = 1; d <= days; d++) {
        const date = new Date()
        date.setDate(date.getDate() + d - 1)
        const dateStr = date.toISOString().split('T')[0]
        itinerary.push({
          day: d,
          date: dateStr,
          morning: formatSpot(attractions[(d - 1) * 3] || attractions[0]),
          afternoon: formatSpot(attractions[(d - 1) * 3 + 1] || attractions[1] || attractions[0]),
          evening: formatSpot(attractions[(d - 1) * 3 + 2] || attractions[2] || attractions[0]),
        })
      }
      context.itinerary = itinerary
      sendSSE(res, { type: 'step', step: 3, name: '行程规划', status: 'complete', data: { days, spotCount: days * 3 } })
    }

    // 补预算
    if (!context.budgetBreakdown) {
      sendSSE(res, { type: 'step', step: 4, name: '预算计算', status: 'start' })
      const result = executeTool('calculate_budget', {
        totalBudget: context.intent?.budget || params.budget,
        days: context.intent?.days || params.days,
        ticketCost: (context.ragResult?.attractions || []).slice(0, (context.intent?.days || params.days) * 3).reduce((s, a) => s + (a.ticket || 0), 0),
      }, context)
      sendSSE(res, { type: 'step', step: 4, name: '预算计算', status: 'complete', data: result.summary })
    }

    // 补建议
    if (!context.tips) {
      sendSSE(res, { type: 'step', step: 5, name: '生成建议', status: 'start' })
      const cityData = context.ragResult || {}
      const result = executeTool('generate_tips', {
        city: context.intent?.city || params.city,
        days: context.intent?.days || params.days,
        bestSeason: cityData.bestSeason || '春秋两季',
        food: cityData.food || [],
        transport: cityData.transport || '公共交通',
      }, context)
      sendSSE(res, { type: 'step', step: 5, name: '生成建议', status: 'complete', data: result.summary })
    }

    // 发送最终结果
    sendSSE(res, {
      type: 'complete',
      data: {
        city: context.intent?.city || params.city,
        days: context.intent?.days || params.days,
        totalBudget: context.intent?.budget || params.budget,
        dailyItinerary: context.itinerary,
        budgetBreakdown: context.budgetBreakdown,
        tips: context.tips || [],
      },
    })
  }
  catch (err) {
    console.error('Agent 执行失败，降级到 Mock:', err.message)
    return executeAgentMock(res, params)
  }
}

// ========== 辅助函数 ==========

function formatSpot(spot) {
  if (!spot) return { spot: '自由活动', description: '可在周边闲逛休息', duration: '1-2小时', ticket: '免费', transportation: '步行' }
  return {
    spot: spot.name,
    description: spot.description,
    duration: spot.duration || '2-3小时',
    ticket: spot.ticket === 0 ? '免费' : `¥${spot.ticket}`,
    transportation: spot.transportation || '公共交通可达',
  }
}

// ========== Mock 降级 ==========

function executeAgentMock(res, params) {
  // 步骤 1：解析意图
  sendSSE(res, { type: 'step', step: 1, name: '解析意图', status: 'start' })
  const tags = []
  if (params.budget <= 2000) tags.push('免费', '文化')
  else if (params.budget <= 5000) tags.push('必去', '文化', '美食')
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

  // 步骤 3：规划行程
  sendSSE(res, { type: 'step', step: 3, name: '行程规划', status: 'start' })
  const itinerary = []
  const spots = ragResult.attractions.slice(0, intent.days * 3)
  for (let d = 1; d <= intent.days; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d - 1)
    itinerary.push({
      day: d,
      date: date.toISOString().split('T')[0],
      morning: formatSpot(spots[(d - 1) * 3]),
      afternoon: formatSpot(spots[(d - 1) * 3 + 1]),
      evening: formatSpot(spots[(d - 1) * 3 + 2]),
    })
  }
  sendSSE(res, { type: 'step', step: 3, name: '行程规划', status: 'complete', data: { days: intent.days, spotCount: intent.days * 3 } })

  // 步骤 4：计算预算
  sendSSE(res, { type: 'step', step: 4, name: '预算计算', status: 'start' })
  const ticketCost = spots.reduce((sum, a) => sum + (a.ticket || 0), 0)
  const budgetBreakdown = {
    accommodation: Math.round(intent.budget * 0.35),
    food: Math.round(intent.budget * 0.25),
    transportation: Math.round(intent.budget * 0.15),
    tickets: Math.min(ticketCost, Math.round(intent.budget * 0.15)),
  }
  budgetBreakdown.other = intent.budget - budgetBreakdown.accommodation - budgetBreakdown.food - budgetBreakdown.transportation - budgetBreakdown.tickets
  sendSSE(res, { type: 'step', step: 4, name: '预算计算', status: 'complete', data: budgetBreakdown })

  // 步骤 5：生成建议
  sendSSE(res, { type: 'step', step: 5, name: '生成建议', status: 'start' })
  const tips = []
  tips.push(`最佳旅行季节：${ragResult.bestSeason}`)
  tips.push(`交通建议：${ragResult.transport}`)
  if (ragResult.food?.length) tips.push(`推荐美食：${ragResult.food.slice(0, 5).join('、')}`)
  if (intent.days >= 3) tips.push('行程较长，建议准备舒适的运动鞋')
  tips.push('建议提前在网上预约热门景点门票')
  tips.push('出行前查看当地天气预报，合理安排行程')
  sendSSE(res, { type: 'step', step: 5, name: '生成建议', status: 'complete', data: { count: tips.length } })

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
    },
  })
}

module.exports = { executeAgent }
