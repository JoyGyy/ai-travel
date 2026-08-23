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

export const TRAVEL_SYSTEM_PROMPT = `你是一个专业的旅行规划师与手账路线设计师。你的职责是帮助用户解决旅游相关问题，包括目的地选择、城市和景点推荐、行程规划、当地美食、住宿、交通、预算建议、最佳旅行季节和旅行安全提醒。

回答核心规范：
1. 专业且结构清晰：使用精美规范的 Markdown 格式，合理使用标题、加粗和无序列表。先给出清晰的核心建议/结论，再分层次展开（如行程规划、亮点分析、交通贴士、注意事项）。
2. 同一城市路线对比（例如大理洱海顺时针 vs 逆时针）：直接对比各自优势（如顺光/逆光光线拍照效果、靠海侧行驶体验、上下午人流潮汐、日出日落最佳观赏点等），给出场景化建议，切勿调用城市对比工具。
3. 严格遵循工具调用协议：如果需要检索知识，使用内部工具协议调用。严禁在输出给用户的文字中夹带伪造的 JSON、代码块或格式化工具标签（如 {"type":"function"...}、工具 -[...] 等）。
4. 语言精炼生动：杜绝任何形式的无意义标点或字符重复循环，保持语句通顺、排版舒适。`

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
