/**
 * 限流中间件
 * 基于内存的滑动窗口限流，按 IP 或已认证用户 ID 统计
 */
import type { NextFunction, Request, Response } from 'express'

import { verifyToken } from '../services/auth.js'

/** 按 key 存储请求时间戳列表，用于滑动窗口计数 */
const requestLog = new Map<string, number[]>()

const CLEANUP_INTERVAL = 60_000
const MAX_RECORD_AGE = 60 * 60_000

// 定期清理过期的时间戳记录，防止内存泄漏
setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of requestLog) {
    const valid = timestamps.filter(t => now - t < MAX_RECORD_AGE)
    if (valid.length === 0)
      requestLog.delete(key)
    else requestLog.set(key, valid)
  }
}, CLEANUP_INTERVAL)

/** 从 Authorization 头解析已认证用户 ID，未认证返回 null */
function getVerifiedUserId(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer '))
    return null

  try {
    return verifyToken(authHeader.slice(7))?.id || null
  }
  catch {
    return null
  }
}

interface RateLimitOptions {
  name?: string
  windowMs?: number
  maxRequests?: number
  message?: string
}

/** 创建限流中间件，已认证用户按用户 ID 限流，未认证按 IP 限流 */
function createRateLimit({ name = 'default', windowMs = 60_000, maxRequests = 15, message = '请求过于频繁，请稍后再试' }: RateLimitOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userId = getVerifiedUserId(req)
    const identity = userId ? `user:${userId}` : `ip:${req.ip || (req.socket.remoteAddress as string) || 'unknown'}`
    const key = `${name}:${identity}`

    const now = Date.now()
    const timestamps = (requestLog.get(key) || []).filter(t => now - t < windowMs)

    if (timestamps.length >= maxRequests) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000)
      res.status(429).json({
        success: false,
        message,
        retryAfter,
      })
      return
    }

    timestamps.push(now)
    requestLog.set(key, timestamps)
    next()
  }
}

export { createRateLimit }
