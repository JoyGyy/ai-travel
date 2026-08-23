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

export const TRAVEL_SYSTEM_PROMPT = `你是「山海行记」专业 AI 旅行规划师。你的职责是为用户提供详尽、实用、结构清晰的旅行路线规划与出行指南。

回答规范：
1. 详实完整：直接输出详细的行程与分析内容，包含【核心建议】、【详细行程/路线解析】、【亮点打卡/美食住宿推荐】、【交通与避坑指南】等完整模块，严禁只输出简短标题或一两句话。
2. 路线对比分析（如大理洱海顺时针 vs 逆时针环湖）：
   - 逆时针路线（大理古城 → 喜洲 → 双廊 → 挖色 → 海东 → 下关）：上午海西顺光拍照极佳，下午到海东临水行驶、夕阳余晖观景最美（经典推荐路线）。
   - 顺时针路线（下关 → 海东 → 挖色 → 双廊 → 喜洲 → 古城）：避开早高峰人流，适合傍晚在喜洲/才村看日落稻田。
   - 结合自驾与住宿（如双廊海景客栈、喜洲白族民居）给出详尽建议。
3. 格式规范：使用清晰规范的 Markdown 格式（如 ### 标题、- 列表、加粗重点），语言生动自然，严禁输出任何模拟工具调用的 JSON 格式或技术标记。`

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
