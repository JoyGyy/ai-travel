/**
 * HTTP 工具函数
 * 提供统一的错误类型（HttpError）、异步路由包装、404 处理和全局错误处理中间件
 */
import type { NextFunction, Request, Response } from 'express'

import { createLogger } from './logger.js'

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

/** 包装异步路由处理器，自动捕获 Promise rejection 传递给 next() */
export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next)
  }
}

/** 404 未匹配路由处理 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: '接口不存在' })
}

/** 全局错误处理中间件：按错误类型返回对应的 HTTP 状态码和错误信息 */
export function errorHandler(err: Error & { type?: string, status?: number, quota?: { used: number, limit: number, remaining: number } }, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err)
    return
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: '请求数据过大' })
    return
  }

  if (err.message === '不允许的跨域来源') {
    res.status(403).json({ success: false, message: err.message })
    return
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: '令牌无效或已过期' })
    return
  }

  if (typeof err.status === 'number') {
    const payload: Record<string, unknown> = { success: false, message: err.message }
    if (err.quota)
      payload.quota = err.quota
    res.status(err.status).json(payload)
    return
  }

  log.error('服务器错误:', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
}
