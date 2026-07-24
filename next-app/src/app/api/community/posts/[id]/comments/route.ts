/**
 * 社区路由 — 评论列表/创建
 * GET /api/community/posts/[id]/comments — 获取评论列表
 * POST /api/community/posts/[id]/comments — 创建评论（需要登录）
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthFromHeaders } from '@/lib/services/auth'
import {
  createCommunityComment,
  listCommunityComments,
} from '@/lib/services/community'
import { extractCsrfToken, verifyCsrfToken } from '@/lib/utils/csrf'
import { errorResponse, httpError } from '@/lib/utils/http'

const MAX_COMMENT_LENGTH = 500

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

function readPositiveInteger(value: unknown, fieldName: string, options: { min?: number, max?: number } = {}): number {
  const { min = 1, max = 30 } = options
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的整数`)
  return number
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 限流
    const rateLimited = checkRateLimit(req, 'community:read', 60, 60_000)
    if (rateLimited) return rateLimited

    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const { searchParams } = new URL(req.url)
    const page = readPositiveInteger(searchParams.get('page') || '1', '页码', { min: 1, max: 10_000 })
    const pageSize = readPositiveInteger(searchParams.get('pageSize') || '20', '每页数量', { min: 1, max: 50 })

    const data = await listCommunityComments(id, page, pageSize)

    return NextResponse.json({ success: true, data, message: 'ok' })
  }
  catch (err) {
    return errorResponse(err)
  }
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
    const rateLimited = checkRateLimit(req, 'community:comment', 20, 60_000)
    if (rateLimited) return rateLimited

    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const body = await req.json() as { content?: unknown }
    const content = readRequiredString(body.content, '评论内容', { min: 1, max: MAX_COMMENT_LENGTH })

    const data = await createCommunityComment(id, user.id, content)

    return NextResponse.json({ success: true, data, message: '评论已发布' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
