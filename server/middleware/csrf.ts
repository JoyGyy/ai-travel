/**
 * CSRF 校验中间件
 * 对写操作（POST/PUT/DELETE）验证 CSRF token
 * 基于 Double Submit Cookie 模式：前端从 cookie 读取 token 并通过 header 回传
 */
import type { NextFunction, Request, Response } from 'express'

import { extractCsrfToken, verifyCsrfToken } from '../utils/csrf.js'
import { httpError } from '../utils/http.js'

/** 不需要 CSRF 校验的 HTTP 方法 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** CSRF 校验中间件：对非安全方法验证 token */
export function csrfProtection(req: Request, _res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  const token = extractCsrfToken(req.headers as Record<string, string | string[] | undefined>, req.headers.cookie)
  if (!token || !verifyCsrfToken(token)) {
    next(httpError(403, 'CSRF token 无效或已过期'))
    return
  }

  next()
}
