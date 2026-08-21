import {
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from 'ai'

import { getTravelModel } from './providers'
import { travelTools } from './tools'

interface RecommendParams {
  budget: number
  city: string
  days: number
}

export function createTravelRecommendStream(params: RecommendParams) {
  const result = streamText({
    maxOutputTokens: 4096,
    model: getTravelModel(),
    prompt: `请为我规划 ${params.city} ${params.days} 天旅行，预算 ${params.budget} 元。请包含每日安排、交通建议、预算拆分、注意事项和适合收藏分享的摘要。`,
    stopWhen: isStepCount(5),
    system:
      '你是专业旅行规划师。请基于用户城市、预算和天数生成结构化中文行程，并在需要时调用旅行工具补充知识库信息。',
    tools: travelTools,
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  })
}
