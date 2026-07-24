/**
 * 景点浏览路由 — 景点详情
 * GET /api/attractions/[id]
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { getAuthFromHeaders } from '@/lib/services/auth'
import { getAttractionById } from '@/lib/services/attractions/attractionService'
import { errorResponse, httpError } from '@/lib/utils/http'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    const { id } = await params
    const data = await getAttractionById(id, user.id)
    if (!data)
      throw httpError(404, '景点不存在')

    return NextResponse.json({ success: true, data, message: 'ok' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
