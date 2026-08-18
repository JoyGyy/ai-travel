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

  await consumeAiQuota(user.id)
  return createTravelChatStream(messages)
})
