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
import { httpError, withErrorHandler, withProtected } from '@/lib/utils/http'
import { readRequiredString } from '@/lib/utils/validation'

type Context = { params: Promise<{ id: string }> }

export const GET = withErrorHandler(
  async (req: Request, context?: unknown) => {
    const { params } = context as Context
    const rateLimited = await checkRateLimit(req, 'community:read', 60, 60_000)
    if (rateLimited) return rateLimited

    const viewer = await getAuthFromHeaders(req.headers)
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const post = await getCommunityPostById(id, viewer?.id)
    if (!post)
      throw httpError(404, '帖子不存在或已删除')

    return NextResponse.json({ success: true, data: post, message: 'ok' })
  },
)

export const DELETE = withProtected<Context>(
  async (_req, { user, params }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    await deleteCommunityPost(id, user.id)
    return NextResponse.json({ success: true, message: '帖子已删除' })
  },
  { rateLimit: { name: 'community:delete', max: 10, windowMs: 60_000 } },
)
