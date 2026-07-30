/**
 * 景点浏览路由 — 用户收藏列表
 * GET /api/attractions/favorites
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { listFavoriteAttractions } from '@/lib/services/attractions/attractionService'
import { withAuth } from '@/lib/utils/http'

export const GET = withAuth(async (req, { user }) => {
  const items = await listFavoriteAttractions(user.id)

  return NextResponse.json({
    success: true,
    data: { items, total: items.length, cities: [], tags: [] },
    message: 'ok',
  })
})
