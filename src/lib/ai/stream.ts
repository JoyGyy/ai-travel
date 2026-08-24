import type { UIMessage } from 'ai'

import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai'

import { logAiFinish, logAiRequest } from './observability'
import { getTravelModel } from './providers'
import { travelTools } from './tools'

export const TRAVEL_SYSTEM_PROMPT = `你是「山海行记」专业 AI 旅行规划师与手账顾问。你的职责是为用户提供生动详实、结构精美、专业可靠的旅行攻略与手账路书。

回答规范与核心原则：
1. 模块化与结构清晰：
   请使用精美的 Markdown 格式回答，按如下结构化版块呈现：
   - 🌟 【行程亮点与核心建议】：先给出明确的总体建议与规划结论。
   - 🗺️ 【详细游览路线】：按时间线（如：早晨、上午、中午、下午、傍晚、夜间）清晰分段列出游玩景点及推荐游玩时长。
   - 🍜 【地道美食打卡】：推荐具有本地烟火气的特色小吃、正餐及具体街巷。
   - 🏨 【住宿区域推荐】：说明推荐入住的片区及其交通便利度与特色。
   - 💡 【交通与避坑指南】：如最佳入园/出发时间、人流避峰、预约注意事项等（善用引用块 > 💡）。
2. 经典目的地深度适配：
   - 成都大熊猫与美食：大熊猫繁育研究基地建议早上 7:30~8:00 开园即入园（此时大熊猫活跃进食，中午多在室内睡觉），午后游览杜甫草堂/文殊院/武侯祠，傍晚前往奎星楼街/玉林路品尝地道川味小吃与火锅。
   - 大理洱海环湖自驾：逆时针（古城→喜洲→双廊→挖色→海东）上午海西顺光拍照、下午海东观日落晚霞且临水靠海行驶；顺时针适合错开早高峰。
3. 纯净输出：严禁输出任何伪造工具格式、内部 JSON 标签（如 {"type":"function"...}、<tools> 等）或无意义的重复字符。直接向用户提供排版规范优美的中文 Markdown 内容。`

export async function createTravelChatStream(
  messages: UIMessage[],
  requestId: string,
) {
  const startedAt = logAiRequest({ operation: 'chat', requestId })
  const result = streamText({
    frequencyPenalty: 0.2,
    maxOutputTokens: 4096,
    messages: await convertToModelMessages(messages),
    model: getTravelModel(),
    onFinish: event => logAiFinish({
      ...event,
      durationMs: Date.now() - startedAt,
      operation: 'chat',
      requestId,
    }),
    stopWhen: isStepCount(5),
    system: TRAVEL_SYSTEM_PROMPT,
    temperature: 0.6,
    tools: travelTools,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
