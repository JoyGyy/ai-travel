/**
 * 用户登录 API
 */
import { NextResponse } from 'next/server'

import { login } from '@/lib/services/auth'
import { httpError, setAuthCookie, withPublicPost } from '@/lib/utils/http'

export const POST = withPublicPost('auth-login', 10, 60_000, async (req) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })
  const result = await login(body.username, body.password)

  const response = NextResponse.json({ success: true, ...result })
  setAuthCookie(response, result.token)

  return response
})
