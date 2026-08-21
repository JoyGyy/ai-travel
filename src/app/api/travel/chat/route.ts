import type { UIMessage } from 'ai'

import { createTravelChatStream } from '@/lib/ai/stream'
import { consumeAiQuota } from '@/lib/services/auth'
import { httpError, withAuthRaw } from '@/lib/utils/http'

export const POST = withAuthRaw(async (req, { user }) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })
  const messages: UIMessage[] = Array.isArray(body.messages) ? body.messages : []
  if (!messages.length) {
    throw httpError(400, '消息不能为空')
  }

  // 支持 model 参数：'siliconflow' | 'deepseek' | 'custom-xxx'
  const model = typeof body.model === 'string' ? body.model : undefined

  // 支持自定义模型配置
  const customModel = body.customModel as { apiKey?: string, baseUrl?: string, model?: string } | undefined

  await consumeAiQuota(user.id)
  return createTravelChatStream(messages, model, customModel)
})
