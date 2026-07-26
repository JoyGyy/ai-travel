/**
 * 用户登录 API
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { login } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function POST(req: Request) {
  try {
    // 限流：每分钟 10 次
    const rateLimited = checkRateLimit(req, 'auth-login', 10, 60_000)
    if (rateLimited) return rateLimited

    const body = await req.json()
    const result = await login(body.username, body.password)

    const response = NextResponse.json({ success: true, ...result })
    // 设置 httpOnly cookie
    response.cookies.set('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 天
      path: '/',
    })

    return response
  }
  catch (err) {
    return errorResponse(err)
  }
}
