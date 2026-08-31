/**
 * AI 手账单会话详情与删除路由
 * GET /api/travel/chat/sessions/[id] — 获取指定会话详情
 * DELETE /api/travel/chat/sessions/[id] — 软删除指定会话
 */
import { NextResponse } from 'next/server'

import { deleteChatSession, getChatSessionById } from '@/lib/services/chatSession'
import { httpError, withAuth, withProtected } from '@/lib/utils/http'
import { readRequiredString } from '@/lib/utils/validation'

interface Context { params: Promise<{ id: string }> }

export const GET = withAuth<Context>(async (_req, { params, user }) => {
  const { id } = await params
  readRequiredString(id, '会话ID', { max: 100, min: 1 })

  const session = await getChatSessionById(id, user.id)
  if (!session) {
    throw httpError(404, '会话不存在或已删除')
  }

  return NextResponse.json({ message: 'ok', session, success: true })
})

export const DELETE = withProtected<Context>(
  async (_req, { params, user }) => {
    const { id } = await params
    readRequiredString(id, '会话ID', { max: 100, min: 1 })

    await deleteChatSession(id, user.id)
    return NextResponse.json({ message: '会话已删除', success: true })
  },
  { rateLimit: { max: 30, name: 'chat:session:delete', windowMs: 60_000 } },
)
