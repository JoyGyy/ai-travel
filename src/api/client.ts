/**
 * API 请求基础封装
 *
 * 提供统一的 JSON 请求方法，内置 JWT 认证头注入、
 * CSRF token 附加、响应解析和错误处理。
 */
import type { ApiSuccess } from '@/types/api'

const AUTH_STORAGE_KEY = 'travel_auth'

/** 自定义 API 错误，携带 HTTP 状态码和响应数据 */
export class ApiError extends Error {
  status?: number
  data?: unknown

  constructor(message: string, { status, data }: { status?: number, data?: unknown } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/** 从 localStorage 读取 Zustand 持久化的 JWT token */
function readPersistedToken(): string {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw)
      return ''

    const parsed = JSON.parse(raw)
    return parsed?.state?.token || ''
  }
  catch {
    return ''
  }
}

export function getAuthHeader(): Record<string, string> {
  const token = readPersistedToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** 安全解析 JSON 响应，非 JSON 类型返回 null */
async function parseResponse<T>(res: Response): Promise<T | null> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json'))
    return null

  try {
    return await res.json() as T
  }
  catch {
    return null
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  auth?: boolean
  signal?: AbortSignal
}

// 不需要 CSRF 保护的 HTTP 方法
// 不需要 CSRF 保护的 HTTP 方法
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * 获取 CSRF token（从 cookie 或 header）
 */
function getCsrfHeader(): Record<string, string> {
  // 尝试从 cookie 读取
  const match = document.cookie.match(/csrf_token=([^;]+)/)
  if (match)
    return { 'X-CSRF-Token': match[1] }
  return {}
}

/**
 * 发起 JSON API 请求。
 */
export async function request<T = ApiSuccess>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    headers,
    auth = false,
    signal,
  } = options

  // 写操作（POST/PUT/DELETE）自动附加 CSRF token
  const isWriteMethod = !SAFE_METHODS.has(method.toUpperCase())

  const res = await fetch(path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(auth ? getAuthHeader() : {}),
      // 写操作自动附加 CSRF token
      ...(isWriteMethod ? getCsrfHeader() : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  const data = await parseResponse<T>(res)

  // 非 2xx 响应抛出 ApiError
  if (!res.ok) {
    const fallback = data && typeof data === 'object' ? data as Record<string, unknown> : {}
    const message = (fallback.message as string) || (fallback.error as string) || `请求失败: HTTP ${res.status}`
    throw new ApiError(message, { status: res.status, data })
  }

  return data as T
}
