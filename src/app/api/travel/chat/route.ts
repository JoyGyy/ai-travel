import type { UIMessage } from 'ai'

import { nanoid } from 'nanoid'

import { createTravelChatStream } from '@/lib/ai/stream'
import { consumeAiQuota } from '@/lib/services/auth'
import { httpError, withProtectedRaw } from '@/lib/utils/http'

export const POST = withProtectedRaw(async (req, { user }) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })
  const rawMessages = Array.isArray(body.messages) ? body.messages : []
  if (!rawMessages.length) {
    throw httpError(400, '消息不能为空')
  }

  // 规范化消息结构，确保每条消息都具有 parts 数组，兼容 Vercel AI SDK 7 的 convertToModelMessages
  const messages: UIMessage[] = rawMessages.map((msg: any, index: number) => {
    if (Array.isArray(msg.parts) && msg.parts.length > 0) {
      return msg
    }
    const text = typeof msg.content === 'string'
      ? msg.content
      : (typeof msg.text === 'string' ? msg.text : '')
    return {
      id: msg.id || `msg-${Date.now()}-${index}`,
      parts: [{ text, type: 'text' }],
      role: msg.role || 'user',
    }
  })

  await consumeAiQuota(user.id)
  return createTravelChatStream(messages, nanoid())
}, { rateLimit: { max: 10, name: 'ai:chat', windowMs: 60_000 } })
