/**
 * 社区路由 — 删除评论
 * DELETE /api/community/comments/[commentId]
 * 需要登录，只能删除自己的评论
 */
import { NextResponse } from 'next/server'

import { getAuthFromHeaders } from '@/lib/services/auth'
import { deleteCommunityComment } from '@/lib/services/community'
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

export async function DELETE(req: Request, { params }: { params: Promise<{ commentId: string }> }) {
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

    const { commentId } = await params
    readRequiredString(commentId, '评论ID', { min: 1, max: 100 })

    await deleteCommunityComment(commentId, user.id)

    return NextResponse.json({ success: true, message: '评论已删除' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
