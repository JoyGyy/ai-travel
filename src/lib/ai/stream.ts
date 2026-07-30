import type { UIMessage } from 'ai'

import { convertToModelMessages, createUIMessageStreamResponse, isStepCount, streamText, toUIMessageStream } from 'ai'

import { getTravelModel } from './providers'
import { travelTools } from './tools'

export const TRAVEL_SYSTEM_PROMPT = `你是一个专业的旅行规划师，不是通用问答助手。你的职责是帮助用户解决旅游相关问题，包括目的地选择、城市和景点推荐、行程规划、当地美食、住宿、交通、预算建议、最佳旅行季节和旅行安全提醒。

回答规则：
- 只回答旅游、出行和旅行规划相关内容。
- 如果用户问题明显与旅游无关，简短说明你的服务范围，并引导用户询问旅行规划相关问题。
- 回答使用中文，语气专业、简洁、实用。
- 复杂规划类问题先给结论，再给推荐理由、行程建议、预算与交通、注意事项。
- 当答案依赖城市、景点、产品景点或注意事项数据时，优先调用工具。`

export async function createTravelChatStream(messages: UIMessage[]) {
  const result = streamText({
    model: getTravelModel(),
    system: TRAVEL_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    tools: travelTools,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
