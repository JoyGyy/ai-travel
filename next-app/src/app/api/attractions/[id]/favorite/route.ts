/**
 * 景点浏览路由 — 收藏/取消收藏
 * POST /api/attractions/[id]/favorite — 收藏景点
 * DELETE /api/attractions/[id]/favorite — 取消收藏
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { getAuthFromHeaders } from '@/lib/services/auth'
import { favoriteAttraction, unfavoriteAttraction } from '@/lib/services/attractions/attractionService'
import { extractCsrfToken, verifyCsrfToken } from '@/lib/utils/csrf'
import { errorResponse, httpError } from '@/lib/utils/http'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    // CSRF 验证
    const csrfToken = extractCsrfToken(req.headers, req.headers.get('cookie') || undefined)
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      throw httpError(403, 'CSRF token 无效')
    }

    const { id } = await params
    const data = await favoriteAttraction(user.id, id)

    return NextResponse.json({ success: true, data, message: '已收藏' })
  }
  catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    // CSRF 验证
    const csrfToken = extractCsrfToken(req.headers, req.headers.get('cookie') || undefined)
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      throw httpError(403, 'CSRF token 无效')
    }

    const { id } = await params
    const data = await unfavoriteAttraction(user.id, id)

    return NextResponse.json({ success: true, data, message: '已取消收藏' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
