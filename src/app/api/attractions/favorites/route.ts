/**
 * 景点浏览路由 — 用户收藏列表
 * GET /api/attractions/favorites
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { listFavoriteAttractions } from '@/lib/services/attractions/attractionService'
import { getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function GET(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    const items = await listFavoriteAttractions(user.id)

    return NextResponse.json({
      success: true,
      data: { items, total: items.length, cities: [], tags: [] },
      message: 'ok',
    })
  }
  catch (err) {
    return errorResponse(err)
  }
}
