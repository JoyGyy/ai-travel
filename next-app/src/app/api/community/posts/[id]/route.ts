/**
 * 社区路由 — 帖子详情/删除
 * GET /api/community/posts/[id] — 获取帖子详情（公开可访问）
 * DELETE /api/community/posts/[id] — 删除自己的帖子（需要登录）
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthFromHeaders } from '@/lib/services/auth'
import {
  deleteCommunityPost,
  getCommunityPostById,
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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 限流
    const rateLimited = checkRateLimit(req, 'community:read', 60, 60_000)
    if (rateLimited) return rateLimited

    const viewer = getAuthFromHeaders(req.headers)
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const post = await getCommunityPostById(id, viewer?.id)
    if (!post)
      throw httpError(404, '帖子不存在或已删除')

    return NextResponse.json({ success: true, data: post, message: 'ok' })
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
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    await deleteCommunityPost(id, user.id)

    return NextResponse.json({ success: true, message: '帖子已删除' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
