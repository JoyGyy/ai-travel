/**
 * 限流工具
 * 基于内存的滑动窗口限流
 *
 * 注意：此实现在自托管（PM2 单实例）场景下有效。
 * 若部署到 Serverless 环境（Vercel 等），限流状态不跨实例共享，
 * 需改用 Redis 或数据库存储。可将 requestLog 替换为外部存储适配器。
 */
import { NextResponse } from 'next/server'

import { getAuthFromHeaders } from './services/auth'

/** 按 key 存储请求时间戳列表，用于滑动窗口计数 */
const requestLog = new Map<string, number[]>()

const CLEANUP_INTERVAL = 60_000
const MAX_RECORD_AGE = 60 * 60_000

// 定期清理过期的时间戳记录，防止内存泄漏
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of requestLog) {
      const valid = timestamps.filter((t) => now - t < MAX_RECORD_AGE)
      if (valid.length === 0) requestLog.delete(key)
      else requestLog.set(key, valid)
    }
  }, CLEANUP_INTERVAL)
}

/**
 * 检查限流，返回 NextResponse 表示被限流，null 表示放行
 * @param userId 可选，已解析的用户 ID，避免重复 JWT 验证
 */
export async function checkRateLimit(
  req: Request,
  name: string,
  maxRequests: number,
  windowMs: number = 60_000,
  userId?: string,
): Promise<NextResponse | null> {
  // 如果调用方已传入 userId，直接使用；否则从 header 解析
  const uid = userId ?? (await getAuthFromHeaders(req.headers))?.id
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'

  const identity = uid ? `user:${uid}` : `ip:${ip}`
  const key = `${name}:${identity}`

  const now = Date.now()
  const timestamps = (requestLog.get(key) || []).filter((t) => now - t < windowMs)

  if (timestamps.length >= maxRequests) {
    const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000)
    return NextResponse.json(
      { message: '请求过于频繁，请稍后再试', retryAfter, success: false },
      { status: 429 },
    )
  }

  timestamps.push(now)
  requestLog.set(key, timestamps)
  return null
}
