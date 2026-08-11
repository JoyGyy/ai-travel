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
  async (req, { user, params }) => {
    const { id } = await params
    readRequiredString(id, '帖子ID', { min: 1, max: 100 })

    const body = (await req.json().catch(() => ({}))) as { content?: unknown }
    const content = readOptionalString(body?.content, '转发附言', MAX_REPOST_CONTENT_LENGTH)

    const data = await repostCommunityPost(id, user.id, content)
    return NextResponse.json({ success: true, data, message: '已转发到社区' })
  },
  { rateLimit: { name: 'community:repost', max: 10, windowMs: 60_000 } },
)
