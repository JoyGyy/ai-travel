/**
 * Next.js Middleware
 * 全局认证守卫：受保护路由未登录时重定向到 /login
 */
import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

// 受保护的路由前缀
const PROTECTED_PATHS = [
  '/detail',
  '/chat',
  '/attractions',
  '/profile',
  '/community/new',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否为受保护路由
  const isProtected = PROTECTED_PATHS.some(
    p => pathname === p || pathname.startsWith(`${p}/`),
  )

  if (!isProtected)
    return NextResponse.next()

  // 检查认证 token（从 cookie 或 Authorization header）
  const token = request.cookies.get('token')?.value
  const authHeader = request.headers.get('authorization')

  if (!token && !authHeader?.startsWith('Bearer ')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/detail/:path*',
    '/chat/:path*',
    '/attractions/:path*',
    '/profile/:path*',
    '/community/new/:path*',
  ],
}
