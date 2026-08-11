/**
 * 用户注册 API
 */
import { NextResponse } from 'next/server'

import { register } from '@/lib/services/auth'
import { setAuthCookie, withPublicPost } from '@/lib/utils/http'

export const POST = withPublicPost('auth-register', 5, 3600_000, async (req) => {
  const body = await req.json()
  const result = await register(body.username, body.password, body.email)

  const response = NextResponse.json({ success: true, ...result })
  setAuthCookie(response, result.token)

  return response
})
