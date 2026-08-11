/**
 * Next.js Middleware
 * 全局认证守卫：受保护路由未登录或 token 无效时重定向到 /login
 */
import type { NextRequest } from 'next/server'

import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'

// 受保护的路由前缀
const PROTECTED_PATHS = ['/detail', '/chat', '/attractions', '/profile', '/community/new']

// 从环境变量获取 JWT_SECRET（middleware 中无法使用 env.ts）
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET 未配置')
  return new TextEncoder().encode(secret)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 检查是否为受保护路由
  const isProtected = PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (!isProtected) return NextResponse.next()

  // 从 cookie 或 Authorization header 获取 token
  const token = request.cookies.get('token')?.value
  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const jwt = token || bearerToken

  if (!jwt) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 验证 JWT 有效性
  try {
    await jwtVerify(jwt, getJwtSecret())
    return NextResponse.next()
  } catch {
    // token 无效或过期，清除 cookie 并重定向到登录页
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('token')
    return response
  }
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
