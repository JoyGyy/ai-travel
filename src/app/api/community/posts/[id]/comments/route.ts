/**
 * 社区路由 — 评论列表/创建
 * GET /api/community/posts/[id]/comments — 获取评论列表
 * POST /api/community/posts/[id]/comments — 创建评论（需要登录）
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { createCommunityComment, listCommunityComments } from '@/lib/services/community'
import { withErrorHandler, withProtected } from '@/lib/utils/http'
import { readRequiredString, readPositiveInteger } from '@/lib/utils/validation'

const MAX_COMMENT_LENGTH = 500

type Context = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(async (req: Request, context?: unknown) => {
  const { params } = context as Context
  const rateLimited = await checkRateLimit(req, 'community:read', 60, 60_000)
  if (rateLimited) return rateLimited

  const { id } = await params
  readRequiredString(id, '帖子ID', { min: 1, max: 100 })

  const { searchParams } = new URL(req.url)
  const page = readPositiveInteger(searchParams.get('page') || '1', '页码', { min: 1, max: 10_000 })
  const pageSize = readPositiveInteger(searchParams.get('pageSize') || '20', '每页数量', {
    min: 1,
    max: 50,
  })

  const data = await listCommunityComments(id, page, pageSize)
  return NextResponse.json({ success: true, data, message: 'ok' })
})

export const POST = withProtected<Context>(
  async (req, { user, params }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const body = (await req.json()) as { content?: unknown }
    const content = readRequiredString(body.content, '评论内容', {
      min: 1,
      max: MAX_COMMENT_LENGTH,
    })

    const data = await createCommunityComment(id, user.id, content)
    return NextResponse.json({ success: true, data, message: '评论已发布' })
  },
  { rateLimit: { name: 'community:comment', max: 20, windowMs: 60_000 } },
)
