/**
 * 社区路由 — 点赞/取消点赞
 * POST /api/community/posts/[id]/like — 点赞帖子
 * DELETE /api/community/posts/[id]/like — 取消点赞
 * 需要登录
 */
import { NextResponse } from 'next/server'

import type { AuthUser } from '@/lib/utils/http'
import {
  likeCommunityPost,
  unlikeCommunityPost,
} from '@/lib/services/community'
import { readRequiredString } from '@/lib/utils/validation'
import { withProtected } from '@/lib/utils/http'

const RATE_LIMIT = { name: 'community:like', max: 60, windowMs: 60_000 }

export const POST = withProtected<{ params: Promise<{ id: string }> }>(
  async (_req, { user, params }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })
    const data = await likeCommunityPost(id, user.id)
    return NextResponse.json({ success: true, data, message: '已点赞' })
  },
  { rateLimit: RATE_LIMIT },
)

export const DELETE = withProtected<{ params: Promise<{ id: string }> }>(
  async (_req, { user, params }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })
    const data = await unlikeCommunityPost(id, user.id)
    return NextResponse.json({ success: true, data, message: '已取消点赞' })
  },
  { rateLimit: RATE_LIMIT },
)
