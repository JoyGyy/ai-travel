/**
 * 限流中间件
 * 基于内存的滑动窗口限流，按 IP 或已认证用户 ID 统计
 */

import { verifyToken } from '../services/auth.js'

/** 请求记录 Map: key → 时间戳数组 */
const requestLog = new Map()

/** 清理过期记录的间隔（毫秒） */
const CLEANUP_INTERVAL = 60_000

/** 记录保留时间（毫秒） */
const MAX_RECORD_AGE = 60 * 60_000

setInterval(() => {
  const now = Date.now()
  for (const [key, timestamps] of requestLog) {
    const valid = timestamps.filter(t => now - t < MAX_RECORD_AGE)
    if (valid.length === 0) requestLog.delete(key)
    else requestLog.set(key, valid)
  }
}, CLEANUP_INTERVAL)

function getVerifiedUserId(req) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) return null

  try {
    return verifyToken(authHeader.slice(7))?.id || null
  }
  catch {
    // 限流不信任未验证令牌，失败时退回 IP 维度
    return null
  }
}

/**
 * 创建限流中间件
 * @param {object} options
 * @param {string} options.name - 限流器名称，用于隔离不同接口
 * @param {number} options.windowMs - 时间窗口（毫秒），默认 60 秒
 * @param {number} options.maxRequests - 窗口内最大请求数，默认 15
 * @param {string} options.message - 超限提示信息
 */
function createRateLimit({ name = 'default', windowMs = 60_000, maxRequests = 15, message = '请求过于频繁，请稍后再试' } = {}) {
  return (req, res, next) => {
    // 优先用已验证用户 ID，其次用 IP
    const userId = getVerifiedUserId(req)
    const identity = userId ? `user:${userId}` : `ip:${req.ip || req.connection.remoteAddress || 'unknown'}`
    const key = `${name}:${identity}`

    const now = Date.now()
    const timestamps = (requestLog.get(key) || []).filter(t => now - t < windowMs)

    if (timestamps.length >= maxRequests) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000)
      return res.status(429).json({
        success: false,
        message,
        retryAfter,
      })
    }

    timestamps.push(now)
    requestLog.set(key, timestamps)
    next()
  }
}

export { createRateLimit }
