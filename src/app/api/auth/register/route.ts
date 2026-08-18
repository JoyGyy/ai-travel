/**
 * 用户注册 API
 */
import { NextResponse } from 'next/server'

import { register } from '@/lib/services/auth'
import { httpError, setAuthCookie, withPublicPost } from '@/lib/utils/http'

export const POST = withPublicPost('auth-register', 5, 3600_000, async (req) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })
  const result = await register(body.username, body.password, body.email)

  const response = NextResponse.json({ success: true, ...result })
  setAuthCookie(response, result.token)

  return response
})
