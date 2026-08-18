/**
 * 社区路由 — 评论列表/创建
 * GET /api/community/posts/[id]/comments — 获取评论列表
 * POST /api/community/posts/[id]/comments — 创建评论（需要登录）
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { createCommunityComment, listCommunityComments } from '@/lib/services/community'
import { httpError, withErrorHandler, withProtected } from '@/lib/utils/http'
import { readPositiveInteger, readRequiredString } from '@/lib/utils/validation'

const MAX_COMMENT_LENGTH = 500

interface Context { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, context?: unknown) => {
  const { params } = context as Context
  const rateLimited = await checkRateLimit(req, 'community:read', 60, 60_000)
  if (rateLimited)
    return rateLimited

  const { id } = await params
  readRequiredString(id, '帖子ID', { max: 100, min: 1 })

  const { searchParams } = new URL(req.url)
  const page = readPositiveInteger(searchParams.get('page') || '1', '页码', { max: 10_000, min: 1 })
  const pageSize = readPositiveInteger(searchParams.get('pageSize') || '20', '每页数量', {
    max: 50,
    min: 1,
  })

  const data = await listCommunityComments(id, page, pageSize)
  return NextResponse.json({ data, message: 'ok', success: true })
})

export const POST = withProtected<Context>(
  async (req, { params, user }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { max: 100, min: 1 })

    const body = (await req.json().catch(() => {
      throw httpError(400, '请求格式无效')
    })) as { content?: unknown }
    const content = readRequiredString(body.content, '评论内容', {
      max: MAX_COMMENT_LENGTH,
      min: 1,
    })

    const data = await createCommunityComment(id, user.id, content)
    return NextResponse.json({ data, message: '评论已发布', success: true })
  },
  { rateLimit: { max: 20, name: 'community:comment', windowMs: 60_000 } },
)
