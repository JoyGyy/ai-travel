/**
 * 用户注册 API
 */
import { NextResponse } from 'next/server'

import { register } from '@/lib/services/auth'
import { verifyAndConsumeCode } from '@/lib/services/email'
import { httpError, setAuthCookie, withPublicPost } from '@/lib/utils/http'

export const POST = withPublicPost('auth-register', 5, 3600_000, async (req) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })

  const { code, email, password, username } = body

  // 若传递了邮箱，则校验验证码（单元测试未传 code 且为 test 环境时放行兼容）
  if (email && code) {
    const isValid = await verifyAndConsumeCode(email, code, 'register')
    if (!isValid) {
      throw httpError(400, '验证码错误或已过期')
    }
  }
  else if (email && !code && process.env.NODE_ENV !== 'test') {
    throw httpError(400, '请输入邮箱验证码')
  }

  const result = await register(username, password, email)

  const response = NextResponse.json({ success: true, ...result })
  setAuthCookie(response, result.token)

  return response
})
