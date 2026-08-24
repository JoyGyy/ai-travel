/**
 * 用户退出登录 API
 * 清除服务端的 httpOnly 认证 Cookie
 */
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({
    message: '退出登录成功',
    success: true,
  })

  response.cookies.set('token', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })

  return response
}
