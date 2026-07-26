/**
 * 修改密码 API
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { changePassword, getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function PUT(req: Request) {
  try {
    const rateLimited = checkRateLimit(req, 'auth-password', 10, 60_000)
    if (rateLimited) return rateLimited

    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    const body = await req.json()
    await changePassword(user.id, body.currentPassword, body.newPassword)

    return NextResponse.json({ success: true, message: '密码修改成功' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
