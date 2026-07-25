/**
 * 景点浏览路由 — 收藏/取消收藏
 * POST /api/attractions/[id]/favorite — 收藏景点
 * DELETE /api/attractions/[id]/favorite — 取消收藏
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { favoriteAttraction, unfavoriteAttraction } from '@/lib/services/attractions/attractionService'
import { withProtected } from '@/lib/utils/http'

export const POST = withProtected<{ params: Promise<{ id: string }> }>(
  async (_req, { user, params }) => {
    const { id } = await params
    const data = await favoriteAttraction(user.id, id)
    return NextResponse.json({ success: true, data, message: '已收藏' })
  },
)

export const DELETE = withProtected<{ params: Promise<{ id: string }> }>(
  async (_req, { user, params }) => {
    const { id } = await params
    const data = await unfavoriteAttraction(user.id, id)
    return NextResponse.json({ success: true, data, message: '已取消收藏' })
  },
)
