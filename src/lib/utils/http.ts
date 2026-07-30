/**
 * HTTP 工具函数
 * 提供统一的错误类型、Next.js Route Handler 的响应封装、
 * 认证+CSRF+限流的组合 wrapper
 */
import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthFromHeaders } from '@/lib/services/auth'

import { extractCsrfToken, verifyCsrfToken } from './csrf'
import { createLogger } from './logger'

const log = createLogger('http')

/** 自定义 HTTP 错误类，携带状态码和可选的配额信息 */
export class HttpError extends Error {
  status: number
  quota?: { used: number, limit: number, remaining: number }

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

/** 创建 HttpError 的便捷工厂函数 */
export function httpError(status: number, message: string): HttpError {
  return new HttpError(status, message)
}

/** 将错误转换为 Next.js JSON 响应 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof HttpError) {
    const payload: Record<string, unknown> = { success: false, message: err.message }
    if (err.quota) payload.quota = err.quota
    return NextResponse.json(payload, { status: err.status })
  }

  if (err instanceof Error) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return NextResponse.json({ success: false, message: '令牌无效或已过期' }, { status: 401 })
    }

    log.error('服务器错误:', err)
    return NextResponse.json({ success: false, message: err.message || '服务器内部错误' }, { status: 500 })
  }

  log.error('未知错误:', err)
  return NextResponse.json({ success: false, message: '服务器内部错误' }, { status: 500 })
}

/** 包装 Route Handler，自动捕获错误并返回统一格式 */
export function withErrorHandler(
  handler: (req: Request, context?: unknown) => Promise<NextResponse>,
) {
  return async (req: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(req, context)
    }
    catch (err) {
      return errorResponse(err)
    }
  }
}

/** 认证结果 */
export interface AuthUser {
  id: string
  username: string
}

/**
 * 从请求中提取并验证认证用户
 * 未登录时抛出 401 HttpError
 */
export function requireAuth(req: Request): AuthUser {
  const user = getAuthFromHeaders(req.headers)
  if (!user)
    throw httpError(401, '未登录')
  return user
}

/**
 * 验证 CSRF token
 * 无效时抛出 403 HttpError
 */
export function requireCsrf(req: Request): void {
  const csrfToken = extractCsrfToken(req.headers, req.headers.get('cookie') || undefined)
  if (!csrfToken || !verifyCsrfToken(csrfToken))
    throw httpError(403, 'CSRF token 无效')
}

/**
 * 组合 wrapper：认证 + CSRF + 限流 + 错误处理
 * 用于需要登录的写操作（POST/DELETE/PATCH/PUT）
 *
 * @example
 * export const POST = withProtected(
 *   async (req, { user }) => {
 *     // 业务逻辑，user 已认证
 *   },
 *   { rateLimit: { name: 'community:post', max: 10, windowMs: 60_000 } }
 * )
 */
export function withProtected<TContext = unknown>(
  handler: (
    req: Request,
    ctx: { user: AuthUser } & TContext,
  ) => Promise<NextResponse>,
  options?: {
    rateLimit?: { name: string, max: number, windowMs?: number }
  },
) {
  return async (req: Request, context?: TContext): Promise<NextResponse> => {
    try {
      const user = requireAuth(req)
      requireCsrf(req)

      if (options?.rateLimit) {
        const { name, max, windowMs } = options.rateLimit
        const blocked = checkRateLimit(req, name, max, windowMs)
        if (blocked) return blocked
      }

      return await handler(req, { user, ...context } as { user: AuthUser } & TContext)
    }
    catch (err) {
      return errorResponse(err)
    }
  }
}

/**
 * 包装需要登录但不需要 CSRF 的 Route Handler（GET 请求）
 *
 * @example
 * export const GET = withAuth(async (req, { user }) => {
 *   // 业务逻辑
 * })
 */
export function withAuth<TContext = unknown>(
  handler: (
    req: Request,
    ctx: { user: AuthUser } & TContext,
  ) => Promise<NextResponse>,
) {
  return async (req: Request, context?: TContext): Promise<NextResponse> => {
    try {
      const user = requireAuth(req)
      return await handler(req, { user, ...context } as { user: AuthUser } & TContext)
    }
    catch (err) {
      return errorResponse(err)
    }
  }
}

/** 包装需要限流但不需要认证的 Route Handler（公开接口） */
export function withRateLimit(
  name: string,
  max: number,
  windowMs: number,
  handler: (req: Request) => Promise<Response>,
) {
  return async (req: Request): Promise<Response> => {
    try {
      const blocked = checkRateLimit(req, name, max, windowMs)
      if (blocked) return blocked
      return await handler(req)
    }
    catch (err) {
      return errorResponse(err)
    }
  }
}

/** 包装需要认证且返回原始 Response 的 Route Handler（SSE 流等） */
export function withAuthRaw(
  handler: (req: Request, ctx: { user: AuthUser }) => Promise<Response>,
) {
  return async (req: Request): Promise<Response> => {
    try {
      const user = requireAuth(req)
      return await handler(req, { user })
    }
    catch (err) {
      return errorResponse(err)
    }
  }
}
