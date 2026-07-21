/**
 * CSRF 防护工具
 * 基于 Double Submit Cookie 模式
 */
import { createHash, randomBytes } from 'node:crypto'

const CSRF_SECRET = process.env.JWT_SECRET || 'csrf-fallback-secret'
const TOKEN_EXPIRY_MS = 60 * 60 * 1000 // 1 小时过期

interface CsrfTokenPayload {
  token: string
  expires: number
}

/**
 * 生成 CSRF token
 */
export function generateCsrfToken(): string {
  const random = randomBytes(32).toString('hex')
  const timestamp = Date.now()
  const payload = `${random}:${timestamp}`
  const signature = createHash('sha256').update(`${payload}:${CSRF_SECRET}`).digest('hex')
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

  // 验证签名
  const payload = `${random}:${timestampStr}`
  const expectedSignature = createHash('sha256').update(`${payload}:${CSRF_SECRET}`).digest('hex')

  return signature === expectedSignature
}

/**
 * 从请求头或 cookie 中提取 CSRF token
 */
export function extractCsrfToken(headers: Record<string, string | string[] | undefined>, cookies?: string): string | null {
  // 优先从 X-CSRF-Token header 获取
  const headerToken = headers['x-csrf-token'] || headers['x-xsrf-token']
  if (typeof headerToken === 'string')
    return headerToken

  // 其次从 cookie 获取
  if (cookies) {
    const match = cookies.match(/csrf_token=([^;]+)/)
    if (match)
      return match[1]
  }

  return null
}
