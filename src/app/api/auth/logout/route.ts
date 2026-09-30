/**
 * 用户退出登录 API
 * 清除服务端的 httpOnly 认证 Cookie
 */
import { NextResponse } from 'next/server'

import { isSecureCookie } from '@/lib/utils/http'

export async function POST(req?: Request) {
  const response = NextResponse.json({
    message: '退出登录成功',
    success: true,
  })

  response.cookies.set('token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: isSecureCookie(req),
  })

  return response
}
