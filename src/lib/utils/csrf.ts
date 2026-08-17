/**
 * CSRF 防护工具
 * 基于 Double Submit Cookie 模式，使用 HMAC-SHA256 签名
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

import { env } from '../env'

const CSRF_SECRET = env.JWT_SECRET
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 小时过期

/**
 * 从请求头或 cookie 中提取 CSRF token
 */
export function extractCsrfToken(headers: Headers, cookies?: string): null | string {
  // 优先从 X-CSRF-Token header 获取
  const headerToken = headers.get('x-csrf-token') || headers.get('x-xsrf-token')
  if (headerToken)
    return headerToken

  // 其次从 cookie 获取
  if (cookies) {
    const match = cookies.match(/csrf_token=([^;]+)/)
    if (match)
      return match[1]
  }

  return null
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

  const parts = token.split(':')
  if (parts.length !== 3)
    return false

  const [random, timestampStr, signature] = parts
  const timestamp = Number(timestampStr)

  // 检查过期
  if (Date.now() - timestamp > TOKEN_EXPIRY_MS)
    return false

  // 使用 HMAC 验证签名，并用 timingSafeEqual 防止时序攻击
  const payload = `${random}:${timestampStr}`
  const expectedSignature = createHmac('sha256', CSRF_SECRET).update(payload).digest('hex')

  if (signature.length !== expectedSignature.length)
    return false
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}
