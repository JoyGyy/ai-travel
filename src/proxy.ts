/**
 * Next.js Proxy
 * 全局认证守卫：受保护路由未登录或 token 无效时重定向到 /login
 */
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

// 受保护的路由前缀（/attractions 和 /community 允许游客公开浏览，仅具体操作需要登录）
const PROTECTED_PATHS = ['/detail', '/chat', '/profile', '/community/new']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否为受保护路由
  const isProtected = PROTECTED_PATHS.some(p => pathname === p || pathname.startsWith(`${p}/`))

  if (!isProtected)
    return NextResponse.next()

  // 只从 httpOnly Cookie 获取 token
  const token = request.cookies.get('token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 验证 JWT 有效性
  try {
    await jwtVerify(token, getJwtSecret())
    return NextResponse.next()
  }
  catch {
    // token 无效或过期，清除 cookie 并重定向到登录页
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('token')
    return response
  }
}

// 从环境变量获取 JWT_SECRET（proxy 中无法使用 env.ts）
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'dev-secret-key-change-in-production-min32chars'
  return new TextEncoder().encode(secret)
}

export const config = {
  matcher: [
    '/detail/:path*',
    '/chat/:path*',
    '/profile/:path*',
    '/community/new/:path*',
  ],
}
