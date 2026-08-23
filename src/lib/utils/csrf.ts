/**
 * CSRF 防护工具
 * 基于 Double Submit Cookie 模式，使用 HMAC-SHA256 签名
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { env } from '../env'

const CSRF_SECRET = env.JWT_SECRET
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 小时过期
const CLOCK_SKEW_TOLERANCE_MS = 10 * 1000 // 10 秒时钟容差

/**
 * 从请求头或 cookie 中提取 CSRF token
 */
export function extractCsrfToken(headers: Headers, cookies?: string): null | string {
  // 优先从 X-CSRF-Token header 获取
  const headerToken = headers.get('x-csrf-token') || headers.get('x-xsrf-token')
  if (headerToken)
    return headerToken

  // 其次从 cookie 获取
  return extractCsrfCookie(cookies)
}

/** 从 Cookie header 中读取 CSRF token。 */
export function extractCsrfCookie(cookies?: string): null | string {
  const match = cookies?.match(/(?:^|;\s*)csrf_token=([^;]+)/)
  if (!match?.[1])
    return null
  try {
    return decodeURIComponent(match[1])
  }
  catch {
    return match[1]
  }
}

/**
 * 生成 CSRF token
 */
export function generateCsrfToken(): string {
  const random = randomBytes(32).toString('hex')
  const timestamp = Date.now()
  const payload = `${random}:${timestamp}`
  const signature = createHmac('sha256', CSRF_SECRET).update(payload).digest('hex')
  return `${payload}:${signature}`
}

/**
 * 验证 CSRF token
 */
export function verifyCsrfToken(token: string): boolean {
  if (!token)
    return false

  let cleanToken = token
  if (token.includes('%3A') || token.includes('%3a')) {
    try {
      cleanToken = decodeURIComponent(token)
    }
    catch {}
  }

  const parts = cleanToken.split(':')
  if (parts.length !== 3)
    return false

  const [random, timestampStr, signature] = parts
  const timestamp = Number(timestampStr)

  // token 不接受未来超出容差的时间戳，并且必须在有效期内。
  const age = Date.now() - timestamp
  if (!Number.isSafeInteger(timestamp) || age < -CLOCK_SKEW_TOLERANCE_MS || age > TOKEN_EXPIRY_MS)
    return false

  // 使用 HMAC 验证签名，并用 timingSafeEqual 防止时序攻击
  const payload = `${random}:${timestampStr}`
  const expectedSignature = createHmac('sha256', CSRF_SECRET).update(payload).digest('hex')

  if (signature.length !== expectedSignature.length)
    return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
