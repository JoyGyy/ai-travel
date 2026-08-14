/**
 * CSRF Token API
 * 生成 CSRF token 并通过 cookie + 响应体返回
 */
import { NextResponse } from 'next/server'

import { generateCsrfToken } from '@/lib/utils/csrf'

export async function GET() {
  const token = generateCsrfToken()

  const response = NextResponse.json({ csrfToken: token })
  response.cookies.set('csrf_token', token, {
    httpOnly: false, // 前端需要读取
    maxAge: 60 * 60, // 1 小时
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
