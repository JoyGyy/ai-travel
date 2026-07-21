import type { NextFunction, Request, Response } from 'express'

import { createLogger } from './logger.js'

const log = createLogger('http')

export class HttpError extends Error {
  status: number
  quota?: { used: number, limit: number, remaining: number }

  constructor(status: number, message: string) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

export function httpError(status: number, message: string): HttpError {
  return new HttpError(status, message)
}

export function asyncHandler(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next)
  }
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, message: '接口不存在' })
}

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
