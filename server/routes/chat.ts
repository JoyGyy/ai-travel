/**
 * AI 对话路由（Agent 模式）
 * POST /api/travel/chat - 多工具 ReAct Agent + 对话历史 + Step 可视化
 */

import type { Request, Response } from 'express'
import { Router } from 'express'
import attractionsDB from '../knowledge/attractions.json' with { type: 'json' }
import { consumeAiQuotaForRequest } from '../middleware/aiQuota.js'
import { requireAuthForRequest } from '../middleware/auth.js'
import { searchAttractions as searchProductAttractions } from '../services/attractions/attractionService.js'
import type { ChatMessage, ToolDefinition } from '../services/llm.js'
import { callLLMWithTools, getLLMConfig } from '../services/llm.js'
import type { SearchResult } from '../services/rag.js'
import { getAllCities, retrieve } from '../services/rag.js'
import { asyncHandler } from '../utils/http.js'
import { createLogger } from '../utils/logger.js'
import { initSSE, sendError, sendSSE } from '../utils/sse.js'

const log = createLogger('chat')
import { ensureArray, readRequiredString } from '../utils/validation.js'

const router: ReturnType<typeof Router> = Router()

// ========== 类型定义 ==========

/** SSE 响应对象，包含 writable 和 destroyed 属性 */
type SSERes = Response & { writable: boolean, destroyed: boolean }

/** 前端传来的历史消息类型 */
interface HistoryMessage {
  role?: string
  content?: string
}

/** 搜索工具参数 */
interface SearchToolArgs {
  city?: string
  query?: string
}

/** 对比城市工具参数 */
interface CompareCitiesArgs {
  city_a: string
  city_b: string
}

/** 旅行贴士工具参数 */
interface TravelTipsArgs {
  city: string
}

/** 产品景点工具参数 */
interface ProductAttractionsArgs {
  city?: string
  keyword?: string
  ticketType?: string
  tag?: string
}

/** SSE 流式文本选项 */
interface StreamTextOptions {
  sources?: string[]
  delayMs?: number
}

/** Mock 模式的 RAG 检索结果 */
interface MockRagResult extends Omit<SearchResult, 'attractions'> {
  attractions: SearchResult['attractions']
}

// ========== Chat Agent System Prompt ==========

const CHAT_SYSTEM_PROMPT = `你是一个专业的旅行规划师，不是通用问答助手。你的职责是帮助用户解决旅游相关问题，包括：
1. 目的地选择、城市和景点推荐
2. 行程规划、路线安排和游玩节奏建议
3. 当地美食、住宿、交通、预算建议
4. 最佳旅行季节、签证、护照、旅行保险和旅行安全提醒

回答规则：
- 只回答旅游、出行和旅行规划相关内容。
- 如果用户问题明显与旅游无关，不要展开回答，只简短说明你的服务范围，并引导用户询问旅行规划相关问题。
- 回答使用中文，语气专业、简洁、实用。
- 复杂规划类问题优先结构化输出：先给结论，再给推荐理由、行程建议、预算与交通、注意事项。
- 用户信息不足时，先给通用建议，再用 1-2 个问题引导用户补充目的地、天数、预算、出行人群或偏好。

你有以下工具，根据用户问题选择合适的工具调用：
- search_travel_info：查询城市、景点、美食、交通等详细信息。当用户询问具体城市或景点时必须调用。
- get_city_list：获取知识库中所有可查询的城市列表。当用户问"有哪些城市""推荐去哪里"时调用。
- compare_cities：对比两个城市的特点。当用户问"A和B哪个好""对比两个城市"时调用。
- search_product_attractions：查询产品景点库，返回可进入详情页、收藏和购票的景点。当用户询问免费景点、收费景点、亲子景点、夜游景点或购票信息时优先调用。
- get_travel_tips：获取城市旅行贴士和注意事项。当用户问"注意事项""带什么""tips"时调用。`

// ========== Tool 定义 ==========

const CHAT_TOOLS: ToolDefinition[] = [
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

const CHAT_STEP_MAP: Record<string, string> = {
  search_travel_info: '查询知识库',
  get_city_list: '获取城市列表',
  compare_cities: '对比城市信息',
  get_travel_tips: '获取旅行贴士',
  search_product_attractions: '查询精选景点',
}

// ========== 旅行主题边界守卫 ==========

const TRAVEL_KEYWORDS = [
  '旅行',
  '旅游',
  '出行',
  '自由行',
  '跟团',
  '自驾',
  '攻略',
  '行程',
  '路线',
  '规划',
  '目的地',
  '城市',
  '景点',
  '门票',
  '游玩',
  '打卡',
  '美食',
  '餐厅',
  '小吃',
  '酒店',
  '住宿',
  '民宿',
  '交通',
  '地铁',
  '公交',
  '高铁',
  '火车',
  '机票',
  '机场',
  '预算',
  '费用',
  '花费',
  '签证',
  '护照',
  '保险',
  '安全',
  '天气',
  '季节',
  '亲子游',
  '情侣游',
  '毕业旅行',
  '蜜月',
  '周末游',
  '夜游',
  '避暑',
  '周边游',
]

const NON_TRAVEL_KEYWORDS = [
  '代码',
  '编程',
  '函数',
  '组件',
  '接口',
  '数据库',
  '算法',
  '数学题',
  '论文',
  '股票',
  '基金',
  '理财',
  '政治',
  '简历',
  '翻译',
  '作文',
  'react',
  'vue',
  'python',
  'java',
  'typescript',
  'javascript',
  'css',
  'html',
]

function normalizeText(text: string): string {
  return String(text || '').trim().toLowerCase()
}

async function getKnownCitiesForGuard(): Promise<string[]> {
  try {
    return await getAllCities()
  }
  catch {
    // 数据库不可用时兜底到静态知识库，保证边界守卫可继续工作
    return attractionsDB.map(item => item.city)
  }
}

function hasKnownAttraction(message: string): boolean {
  return attractionsDB.some(cityData => cityData.attractions.some(attraction => message.includes(attraction.name)))
}

async function isTravelRelatedMessage(message: string): Promise<boolean> {
  const normalized = normalizeText(message)
  if (!normalized)
    return false

  const cities = await getKnownCitiesForGuard()
  const hasKnownCity = cities.some(city => message.includes(city))
  const hasTravelKeyword = TRAVEL_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()))

  if (hasKnownCity || hasKnownAttraction(message) || hasTravelKeyword)
    return true

  const hasNonTravelKeyword = NON_TRAVEL_KEYWORDS.some(keyword => normalized.includes(keyword.toLowerCase()))
  if (hasNonTravelKeyword)
    return false

  // 不确定的问题交给 system prompt 约束，避免误伤边缘旅行咨询
  return true
}

function getNonTravelResponse(): string {
  return '我主要提供旅行规划咨询，暂时不展开这个话题。你可以问我：\n\n1. 北京三日游怎么安排？\n2. 亲子游适合去哪里？\n3. 去成都预算怎么规划？'
}

async function streamTextResponse(res: SSERes, content: string, options: StreamTextOptions = {}): Promise<void> {
  const { sources = [], delayMs = 0 } = options
  let accumulated = ''

  for (const char of content) {
    accumulated += char
    sendSSE(res, { type: 'chunk', content: char })
    if (delayMs > 0 && (char === '\n' || accumulated.length % 5 === 0)) {
      await delay(delayMs)
    }
  }

  sendSSE(res, { type: 'complete', data: { content, sources } })
}

async function handleNonTravelMessage(message: string, res: SSERes, options: StreamTextOptions = {}): Promise<boolean> {
  if (await isTravelRelatedMessage(message))
    return false

  await streamTextResponse(res, getNonTravelResponse(), { sources: [], delayMs: options.delayMs ?? 10 })
  return true
}

// ========== 工具执行 ==========

/**
 * 统一工具分发
 * @param toolName - 工具名
 * @param args - 工具参数
 * @returns JSON 格式的结果
 */
async function executeChatTool(toolName: string, args: Record<string, unknown>): Promise<string> {
  switch (toolName) {
    case 'search_travel_info':
      return await executeSearchTool(args as SearchToolArgs)
    case 'get_city_list':
      return await executeGetCityList()
    case 'compare_cities':
      return await executeCompareCities(args as unknown as CompareCitiesArgs)
    case 'get_travel_tips':
      return await executeGetTravelTips(args as unknown as TravelTipsArgs)
    case 'search_product_attractions':
      return executeProductAttractionsTool(args as ProductAttractionsArgs)
    default:
      return JSON.stringify({ error: `未知工具: ${toolName}` })
  }
}

async function executeSearchTool(args: SearchToolArgs): Promise<string> {
  const city = args.city || ''
  const query = args.query || ''
  const result = await retrieve(city, [], query || city)
  if (!result) {
    for (const cityData of attractionsDB) {
      const found = cityData.attractions.find(a => (query || '').includes(a.name) || city.includes(a.name))
      if (found) {
        const cityResult = await retrieve(cityData.city, [], query || city)
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

async function executeGetCityList(): Promise<string> {
  const cities = await getAllCities()
  return JSON.stringify({
    cities,
    total: cities.length,
    message: `知识库中共有 ${cities.length} 个城市可查询`,
  })
}

async function executeCompareCities(args: CompareCitiesArgs): Promise<string> {
  const { city_a, city_b } = args
  const dataA = await retrieve(city_a, [], city_a)
  const dataB = await retrieve(city_b, [], city_b)

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

async function executeGetTravelTips(args: TravelTipsArgs): Promise<string> {
  const { city } = args
  const result = await retrieve(city, [], city)
  if (!result) {
    return JSON.stringify({ error: `未找到"${city}"的旅行信息` })
  }

  const tips: string[] = []
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

function executeProductAttractionsTool(args: ProductAttractionsArgs): string {
  const filters = {
    city: typeof args.city === 'string' ? args.city : '',
    keyword: typeof args.keyword === 'string' ? args.keyword : '',
    ticketType: ['free', 'paid'].includes(args.ticketType ?? '') ? args.ticketType! : '',
    tag: typeof args.tag === 'string' ? args.tag : '',
  }
  const attractions = (searchProductAttractions(filters) as unknown as Array<{
    id: string
    name: string
    city: string
    ticketType: string
    priceText: string
    summary: string
    tags: string[]
  }>).slice(0, 8).map(item => ({
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
 * @param historyMessages - 前端传来的历史消息
 * @param currentMessage - 当前用户消息
 * @returns 用于 LLM 的消息数组
 */
async function buildMessagesWithMemory(historyMessages: HistoryMessage[], currentMessage: string): Promise<ChatMessage[]> {
  const systemMsg: ChatMessage = { role: 'system', content: CHAT_SYSTEM_PROMPT }

  // 无历史或历史很短，直接用
  if (!historyMessages || historyMessages.length <= 6) {
    return [
      systemMsg,
      ...(historyMessages || []).map(m => ({ role: m.role as ChatMessage['role'], content: m.content || '' })),
      { role: 'user', content: currentMessage },
    ]
  }

  // 旧消息提取摘要
  const oldMessages = historyMessages.slice(0, -6)
  const cities = await getAllCities()
  const mentionedCities = new Set<string>()
  const topics: string[] = []

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
    ...(summary ? [{ role: 'system' as const, content: summary }] : []),
    ...recentMessages.map(m => ({ role: m.role as ChatMessage['role'], content: m.content || '' })),
    { role: 'user', content: currentMessage },
  ]
}

// ========== Chat Agent 主流程 ==========

router.post('/chat', asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as { message?: unknown, messages?: unknown }
  const message = readRequiredString(body.message, '问题', { min: 1, max: 2000 })
  const historyMessages = (ensureArray(body.messages, '历史消息', { max: 20 }) as HistoryMessage[]).map((item) => {
    const role = item?.role === 'assistant' ? 'assistant' : 'user'
    const content = typeof item?.content === 'string' ? item.content.slice(0, 2000) : ''
    return { role, content }
  }).filter(item => item.content)

  requireAuthForRequest(req)
  await consumeAiQuotaForRequest(req, res)

  try {
    initSSE(res)

    let ragSources: string[] = []

    if (await handleNonTravelMessage(message, res as SSERes))
      return

    // 尝试 Agent 模式（LLM + function calling）
    const config = getLLMConfig()
    if (config) {
      try {
        const messages = await buildMessagesWithMemory(historyMessages, message)
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
            let args: Record<string, unknown> = {}
            try {
              args = JSON.parse(toolCall.function.arguments)
            }
            catch {
              // JSON 解析失败时 args 保持 {}
            }

            stepCounter++
            const stepName = CHAT_STEP_MAP[toolName] || toolName

            // 发送 step start 事件
            sendSSE(res, { type: 'step', step: stepCounter, name: stepName, status: 'start' })

            const toolResult = await executeChatTool(toolName, args)

            // 提取结果摘要
            let summary: Record<string, unknown> = {}
            try {
              const parsed = JSON.parse(toolResult) as Record<string, unknown>
              if (parsed.attractions) {
                ragSources = (parsed.attractions as Array<{ name: string }>).map(a => a.name)
                summary = { city: parsed.city, attractionCount: (parsed.attractions as unknown[]).length }
              }
              else if (parsed.cities) {
                summary = { cityCount: parsed.total }
              }
              else if (parsed.city_a) {
                summary = { city_a: (parsed.city_a as { city: string }).city, city_b: (parsed.city_b as { city: string }).city }
              }
              else if (parsed.tips) {
                summary = { city: parsed.city, tipCount: (parsed.tips as unknown[]).length }
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
      catch (err: unknown) {
        log.error('Chat Agent 失败，降级到 Mock:', (err as Error).message)
        sendSSE(res, { type: 'notice', message: 'AI 模型暂不可用，已切换为知识库模式' })
      }
    }

    // ========== Mock 降级 ==========
    let ragResult: MockRagResult | null = null
    const cities = await getAllCities()
    let stepCounter = 0

    // 城市名匹配
    for (const city of cities) {
      if (message.includes(city)) {
        const result = await retrieve(city, [], city)
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
          const result = await retrieve(cityData.city, [], message)
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

    const mockReply = await getMockResponse(message, ragResult)
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
  catch (err: unknown) {
    log.error('对话失败:', err)
    sendError(res, '处理消息时出现错误，请稍后重试')
  }
  finally {
    res.end()
  }
}))

// ========== Mock 回复 ==========

async function getMockResponse(message: string, ragResult: MockRagResult | null): Promise<string> {
  if (ragResult) {
    const { attractions, food, bestSeason, transport } = ragResult
    const city = ragResult.city || '该城市'
    const isFood = /美食|吃|餐厅|小吃/.test(message)
    const isTransport = /交通|怎么去|怎么走|机场|高铁|火车站/.test(message)
    const isPlan = /[天日玩]|行程|预算|规划|攻略/.test(message) || (/去/.test(message) && !/^去\S{2,4}$/.test(message.trim()))
    const allCitySpots = attractionsDB.find(c => c.city === city)?.attractions || []
    const isSpecificSpot = allCitySpots.find(a => message.includes(a.name))

    if (isSpecificSpot) {
      return `**${isSpecificSpot.name}**\n\n${isSpecificSpot.description || ''}\n\n门票：${isSpecificSpot.ticket ? `${isSpecificSpot.ticket}元` : '免费'}\n开放时间：全天\n建议游玩时长：${isSpecificSpot.duration || '2-3小时'}\n交通：公共交通可达\n\n建议提前规划好行程，避免高峰期。`
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
    const cities = await getAllCities()
    return `知识库中可查询的城市：\n\n${cities.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\n共 ${cities.length} 个城市，告诉我你想了解哪个城市吧！`
  }

  if (message.includes('保险')) {
    return '旅行保险购买建议：\n\n1. 选择包含意外医疗和紧急救援的保险\n2. 注意保障范围是否覆盖目的地\n3. 高风险活动需要额外保障\n4. 建议在出发前至少一天购买\n\n推荐平台：支付宝、携程、慧择等。'
  }

  return '你好！我是你的 AI 旅行顾问，可以帮你：\n\n1. 规划旅行行程\n2. 推荐当地景点和美食\n3. 提供旅行攻略和建议\n4. 解答旅行相关问题\n\n请告诉我你想去哪里旅行，我来帮你规划！'
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export default router

export {
  executeChatTool as executeChatToolForTest,
  getNonTravelResponse as getNonTravelResponseForTest,
  handleNonTravelMessage as handleNonTravelMessageForTest,
  isTravelRelatedMessage as isTravelRelatedMessageForTest,
}
