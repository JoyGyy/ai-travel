/**
 * 用户注册 API
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { register } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function POST(req: Request) {
  try {
    // 限流：每小时 5 次
    const rateLimited = checkRateLimit(req, 'auth-register', 5, 3600_000)
    if (rateLimited) return rateLimited

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
  }
  catch (err) {
    return errorResponse(err)
  }
}
