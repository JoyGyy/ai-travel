/**
 * 认证中间件
 * 从请求头提取 JWT token 并验证用户身份，将用户信息挂载到 req.user
 */
import type { NextFunction, Request, Response } from 'express'

import { verifyToken } from '../services/auth.js'
import { httpError } from '../utils/http.js'

/** 已认证用户信息 */
export interface AuthUser {
  id: string
  username: string
}

export function requireAuthForRequest(req: Request): AuthUser {
  if ((req as Request & { user?: AuthUser }).user) {
    return (req as Request & { user: AuthUser }).user!
  }

  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer '))
    throw httpError(401, '未登录')

  const token = authHeader.slice(7)
  const user = verifyToken(token)
  ;(req as Request & { user: AuthUser }).user = user
  return user
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    requireAuthForRequest(req)
    next()
  }
  catch (err) {
    next(err)
  }
}
