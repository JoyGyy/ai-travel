/**
 * 用户登录 API
 */
import { NextResponse } from 'next/server'

import { login } from '@/lib/services/auth'
import { setAuthCookie, withRateLimit } from '@/lib/utils/http'

export const POST = withRateLimit('auth-login', 10, 60_000, async (req) => {
  const body = await req.json()
  const result = await login(body.username, body.password)

  const response = NextResponse.json({ success: true, ...result })
  setAuthCookie(response, result.token)

  return response
})
