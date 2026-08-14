/**
 * 社区路由 — 转发帖子
 * POST /api/community/posts/[id]/repost
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { repostCommunityPost } from '@/lib/services/community'
import { withProtected } from '@/lib/utils/http'
import { readOptionalString, readRequiredString } from '@/lib/utils/validation'

const MAX_REPOST_CONTENT_LENGTH = 500

export const POST = withProtected<{ params: Promise<{ id: string }> }>(
  async (req, { params, user }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { max: 100, min: 1 })

    const body = (await req.json().catch(() => ({}))) as { content?: unknown }
    const content = readOptionalString(body?.content, '转发附言', MAX_REPOST_CONTENT_LENGTH)

    const data = await repostCommunityPost(id, user.id, content)
    return NextResponse.json({ data, message: '已转发到社区', success: true })
  },
  { rateLimit: { max: 10, name: 'community:repost', windowMs: 60_000 } },
)
