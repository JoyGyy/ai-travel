/**
 * 修改密码 API
 */
import { NextResponse } from 'next/server'

import { changePassword } from '@/lib/services/auth'
import { httpError, withProtected } from '@/lib/utils/http'

export const PUT = withProtected(
  async (req, { user }) => {
    const body = await req.json().catch(() => {
      throw httpError(400, '请求格式无效')
    })
    await changePassword(user.id, body.currentPassword, body.newPassword)

    return NextResponse.json({ message: '密码修改成功', success: true })
  },
  { rateLimit: { max: 10, name: 'auth-password', windowMs: 60_000 } },
)
