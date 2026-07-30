/**
 * 用户注册 API
 */
import { NextResponse } from 'next/server'

import { register } from '@/lib/services/auth'
import { withRateLimit } from '@/lib/utils/http'

export const POST = withRateLimit('auth-register', 5, 3600_000, async (req) => {
  const body = await req.json()
  const result = await register(body.username, body.password, body.email)

  const response = NextResponse.json({ success: true, ...result })
  response.cookies.set('token', result.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  })

  return response
})
