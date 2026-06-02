/**
 * 限流中间件
 * 基于内存的滑动窗口限流，按 IP 或用户 ID 统计
 */

/** 请求记录 Map: key → 时间戳数组 */
const requestLog = new Map()

/** 清理过期记录的间隔（毫秒） */
const CLEANUP_INTERVAL = 60_000

/**
 * 创建限流中间件
 * @param {object} options
 * @param {number} options.windowMs - 时间窗口（毫秒），默认 60 秒
 * @param {number} options.maxRequests - 窗口内最大请求数，默认 15
 * @param {string} options.message - 超限提示信息
 */
function createRateLimit({ windowMs = 60_000, maxRequests = 15, message = '请求过于频繁，请稍后再试' } = {}) {
  // 定期清理过期记录，防止内存泄漏
  setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of requestLog) {
      const valid = timestamps.filter(t => now - t < windowMs)
      if (valid.length === 0) requestLog.delete(key)
      else requestLog.set(key, valid)
    }
  }, CLEANUP_INTERVAL)

  return (req, res, next) => {
    // 优先用用户 ID，其次用 IP
    const userId = req.headers.authorization
      ? (() => { try { return require('jsonwebtoken').decode(req.headers.authorization.slice(7))?.id } catch { return null } })()
      : null
    const key = userId || req.ip || req.connection.remoteAddress || 'unknown'

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

module.exports = { createRateLimit }
