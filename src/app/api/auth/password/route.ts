/**
 * 修改密码 API
 */
import { NextResponse } from 'next/server'

import { changePassword } from '@/lib/services/auth'
import { withProtected } from '@/lib/utils/http'

export const PUT = withProtected(
  async (req, { user }) => {
    const body = await req.json()
    await changePassword(user.id, body.currentPassword, body.newPassword)

    return NextResponse.json({ success: true, message: '密码修改成功' })
  },
  { rateLimit: { name: 'auth-password', max: 10, windowMs: 60_000 } },
)
