/**
 * CSRF 防护中间件
 * 对所有写操作（POST/PUT/DELETE）验证 CSRF token
 */
import type { NextFunction, Request, Response } from 'express'

import { extractCsrfToken, generateCsrfToken, verifyCsrfToken } from '../utils/csrf.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * CSRF 验证中间件
 * 跳过安全方法（GET/HEAD/OPTIONS），仅验证写操作
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // 安全方法不需要 CSRF 验证
  if (SAFE_METHODS.has(req.method)) {
    next()
    return
  }

  const token = extractCsrfToken(req.headers as Record<string, string | string[] | undefined>, req.headers.cookie)

  if (!token || !verifyCsrfToken(token)) {
    res.status(403).json({ success: false, message: 'CSRF token 无效或已过期' })
    return
  }

  next()
}

/**
 * 生成并设置 CSRF token 到响应头和 cookie
 */
export function setCsrfToken(req: Request, res: Response): void {
  const token = generateCsrfToken()

  // 设置到响应头，前端可以从 header 读取
  res.setHeader('X-CSRF-Token', token)

  // 同时设置到 cookie（httpOnly=false 以便前端 JS 读取）
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // 1 小时
  })
}
