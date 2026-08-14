/**
 * 社区路由 — 点赞/取消点赞
 * POST /api/community/posts/[id]/like — 点赞帖子
 * DELETE /api/community/posts/[id]/like — 取消点赞
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { likeCommunityPost, unlikeCommunityPost } from '@/lib/services/community'
import { withProtected } from '@/lib/utils/http'
import { readRequiredString } from '@/lib/utils/validation'

const RATE_LIMIT = { max: 60, name: 'community:like', windowMs: 60_000 }

export const POST = withProtected<{ params: Promise<{ id: string }> }>(
  async (_req, { params, user }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { max: 100, min: 1 })
    const data = await likeCommunityPost(id, user.id)
    return NextResponse.json({ data, message: '已点赞', success: true })
  },
  { rateLimit: RATE_LIMIT },
)

export const DELETE = withProtected<{ params: Promise<{ id: string }> }>(
  async (_req, { params, user }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { max: 100, min: 1 })
    const data = await unlikeCommunityPost(id, user.id)
    return NextResponse.json({ data, message: '已取消点赞', success: true })
  },
  { rateLimit: RATE_LIMIT },
)
