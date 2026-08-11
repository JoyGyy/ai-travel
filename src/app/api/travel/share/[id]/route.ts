/**
 * 分享路由 — 获取分享数据
 * GET /api/travel/share/[id]
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getShare } from '@/lib/services/share'
import { errorResponse, httpError } from '@/lib/utils/http'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 限流
    const rateLimited = await checkRateLimit(req, 'share:get', 30, 60_000)
    if (rateLimited) return rateLimited

    const { id } = await params
    const share = getShare(id)
    if (!share)
      throw httpError(404, '分享不存在')

    return NextResponse.json({ success: true, data: share })
  }
  catch (err) {
    return errorResponse(err)
  }
}
