/**
 * 管理员权限中间件
 * 通过环境变量 ADMIN_USERS 配置管理员用户名列表（逗号分隔）
 */
import type { NextFunction, Request, Response } from 'express'

import { env } from '../config/env.js'
import { httpError } from '../utils/http.js'

/** 解析管理员用户名列表 */
function getAdminUsers(): Set<string> {
  const raw = env.ADMIN_USERS || ''
  return new Set(raw.split(',').map(s => s.trim()).filter(Boolean))
}

/** 校验当前用户是否为管理员 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: { id: string, username: string } }).user
  if (!user) {
    next(httpError(401, '未登录'))
    return
  }

  const adminUsers = getAdminUsers()
  if (adminUsers.size === 0 || !adminUsers.has(user.username)) {
    next(httpError(403, '无管理权限'))
    return
  }

  next()
}
