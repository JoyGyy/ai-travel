/**
 * 社区路由 — 删除评论
 * DELETE /api/community/comments/[commentId]
 * 需要登录，只能删除自己的评论
 */
import { NextResponse } from 'next/server'

import { deleteCommunityComment } from '@/lib/services/community'
import { withProtected } from '@/lib/utils/http'
import { readRequiredString } from '@/lib/utils/validation'

export const DELETE = withProtected<{ params: Promise<{ commentId: string }> }>(
  async (_req, { user, params }) => {
    const { commentId } = await params
    readRequiredString(commentId, '评论ID', { min: 1, max: 100 })

    await deleteCommunityComment(commentId, user.id)
    return NextResponse.json({ success: true, message: '评论已删除' })
  },
  // 修复：补充之前遗漏的限流
  { rateLimit: { name: 'community:comment:delete', max: 30, windowMs: 60_000 } },
)
