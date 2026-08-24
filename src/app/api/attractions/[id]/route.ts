/**
 * 景点浏览路由 — 景点详情
 * GET /api/attractions/[id]
 * 支持公开浏览，已登录用户携带个性化收藏标记
 */
import { NextResponse } from 'next/server'

import { getAttractionById } from '@/lib/services/attractions/attractionService'
import { getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse, httpError } from '@/lib/utils/http'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getAuthFromHeaders(req.headers)
    const { id } = await params
    const data = await getAttractionById(id, user?.id)
    if (!data)
      throw httpError(404, '景点不存在')

    return NextResponse.json({ data, message: 'ok', success: true })
  }
  catch (err) {
    return errorResponse(err)
  }
}
