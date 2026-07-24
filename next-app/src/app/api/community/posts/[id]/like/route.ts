/**
 * 社区路由 — 点赞/取消点赞
 * POST /api/community/posts/[id]/like — 点赞帖子
 * DELETE /api/community/posts/[id]/like — 取消点赞
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthFromHeaders } from '@/lib/services/auth'
import {
  likeCommunityPost,
  unlikeCommunityPost,
} from '@/lib/services/community'
import { extractCsrfToken, verifyCsrfToken } from '@/lib/utils/csrf'
import { errorResponse, httpError } from '@/lib/utils/http'

function readRequiredString(value: unknown, fieldName: string, options: { min?: number, max?: number } = {}): string {
  const { min = 1, max = 2000 } = options
  if (typeof value !== 'string')
    throw httpError(400, `${fieldName}必须是文本`)
  const trimmed = value.trim()
  if (trimmed.length < min)
    throw httpError(400, `请输入${fieldName}`)
  if (trimmed.length > max)
    throw httpError(400, `${fieldName}不能超过 ${max} 个字符`)
  return trimmed
}

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

    // 限流
    const rateLimited = checkRateLimit(req, 'community:like', 60, 60_000)
    if (rateLimited) return rateLimited

    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const data = await likeCommunityPost(id, user.id)

    return NextResponse.json({ success: true, data, message: '已点赞' })
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

    // 限流
    const rateLimited = checkRateLimit(req, 'community:like', 60, 60_000)
    if (rateLimited) return rateLimited

    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const data = await unlikeCommunityPost(id, user.id)

    return NextResponse.json({ success: true, data, message: '已取消点赞' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
