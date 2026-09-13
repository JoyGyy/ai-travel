import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/** 受保护的页面路径前缀 */
export const PROTECTED_PAGE_PATHS = ['/profile', '/community/new']

/**
 * Next.js 全局路由拦截中间件
 * 拦截未登录访问受保护页面，并携带重定向参数跳转至登录页
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PAGE_PATHS.some(
    prefix => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtected) {
    const token = request.cookies.get('token')?.value

    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/community/new/:path*',
  ],
}
