/**
 * AI 手账会话列表与保存/清空路由
 * GET /api/travel/chat/sessions — 获取当前登录用户的所有会话列表
 * POST /api/travel/chat/sessions — 保存或更新会话（UPSERT）
 * DELETE /api/travel/chat/sessions — 清空当前用户的所有会话
 */
import { NextResponse } from 'next/server'

import {
  clearAllChatSessions,
  listChatSessions,
  saveChatSession,
} from '@/lib/services/chatSession'
import { httpError, withAuth, withProtected } from '@/lib/utils/http'
import { readRequiredString } from '@/lib/utils/validation'

export const GET = withAuth(async (_req, { user }) => {
  const sessions = await listChatSessions(user.id)
  return NextResponse.json({ message: 'ok', sessions, success: true })
})

export const POST = withProtected(
  async (req, { user }) => {
    const body = await req.json().catch(() => {
      throw httpError(400, '请求体格式无效')
    })

    const id = readRequiredString(body.id, '会话ID', { max: 100, min: 1 })
    const title = typeof body.title === 'string' ? body.title : undefined
    const city = typeof body.city === 'string' ? body.city : undefined
    const messages = Array.isArray(body.messages) ? body.messages : []
    const createdAt = body.createdAt
    const updatedAt = body.updatedAt

    const session = await saveChatSession(user.id, {
      city,
      createdAt,
      id,
      messages,
      title,
      updatedAt,
    })

    return NextResponse.json({ message: 'ok', session, success: true })
  },
  { rateLimit: { max: 60, name: 'chat:session:save', windowMs: 60_000 } },
)

export const DELETE = withProtected(
  async (_req, { user }) => {
    await clearAllChatSessions(user.id)
    return NextResponse.json({ message: '已清空所有历史会话', success: true })
  },
  { rateLimit: { max: 10, name: 'chat:session:clear', windowMs: 60_000 } },
)
