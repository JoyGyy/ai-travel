/**
 * API 请求基础封装
 *
 * 提供统一的 JSON 请求方法，内置 Cookie 认证、
 * CSRF token 附加、响应解析和错误处理。
 */
import type { ApiSuccess } from '@/types/api'

interface RequestOptions {
  auth?: boolean
  body?: FormData | unknown
  headers?: Record<string, string>
  method?: string
  signal?: AbortSignal
}

/** 自定义 API 错误，携带 HTTP 状态码和响应数据 */
export class ApiError extends Error {
  data?: unknown
  status?: number

  constructor(message: string, { data, status }: { data?: unknown, status?: number } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export function getAuthHeader(): Record<string, string> {
  return {}
}

export function hasAuthToken(): boolean {
  return false
}

/** 安全解析 JSON 响应，非 JSON 类型返回 null */
async function parseResponse<T>(res: Response): Promise<null | T> {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json'))
    return null

  try {
    return (await res.json()) as T
  }
  catch {
    return null
  }
}

// 不需要 CSRF 保护的 HTTP 方法
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/**
 * 发起 JSON API 请求。
 * 写操作自动附加 CSRF token；若因 token 过期/失效返回 403，会自动刷新并重试一次。
 */
export async function request<T = ApiSuccess>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = false, body, headers, method = 'GET', signal } = options

  const isWriteMethod = !SAFE_METHODS.has(method.toUpperCase())
  if (isWriteMethod)
    await ensureCsrfToken()

  const isFormData = body instanceof FormData

  async function doFetch(): Promise<Response> {
    return fetch(path, {
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      credentials: 'include',
      headers: {
        ...(body === undefined || isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(auth ? getAuthHeader() : {}),
        ...(isWriteMethod ? getCsrfHeader() : {}),
        ...headers,
      },
      method,
      signal,
    })
  }

  let res = await doFetch()
  let data = await parseResponse<T>(res)

  // CSRF 403 自动刷新重试一次
  if (!res.ok && res.status === 403 && isWriteMethod) {
    const errMsg
      = data && typeof data === 'object'
        ? (data as Record<string, unknown>).message || (data as Record<string, unknown>).error
        : ''
    if (/csrf/i.test(String(errMsg))) {
      await refreshCsrfToken()
      res = await doFetch()
      data = await parseResponse<T>(res)
    }
  }

  // 非 2xx 响应抛出 ApiError
  if (!res.ok) {
    const fallback = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    const message
      = (fallback.message as string) || (fallback.error as string) || `请求失败: HTTP ${res.status}`
    throw new ApiError(message, { data, status: res.status })
  }

  return data as T
}

/** 写请求前确保浏览器已有有效的 CSRF cookie */
async function ensureCsrfToken(): Promise<void> {
  if (readCsrfToken())
    return

  await refreshCsrfToken()
}

function getCsrfHeader(): Record<string, string> {
  const token = readCsrfToken()
  return token ? { 'X-CSRF-Token': token } : {}
}

/**
 * 获取 CSRF token（从 cookie）
 */
function readCsrfToken(): string {
  const raw = document.cookie.match(/csrf_token=([^;]+)/)?.[1] || ''
  if (!raw)
    return ''

  const token = decodeURIComponent(raw)

  // 格式: random:timestamp:signature，检查 timestamp 是否在 1 小时内
  const parts = token.split(':')
  if (parts.length === 3) {
    const timestamp = Number(parts[1])
    if (Number.isFinite(timestamp) && Date.now() - timestamp > 60 * 60 * 1000) {
      document.cookie = 'csrf_token=; max-age=0; path=/'
      return ''
    }
  }

  return token
}

/** 强制刷新 CSRF token（清除旧 cookie 后重新获取） */
async function refreshCsrfToken(): Promise<void> {
  document.cookie = 'csrf_token=; max-age=0; path=/'
  const res = await fetch('/api/auth/csrf-token', { credentials: 'include' })
  if (!res.ok)
    throw new ApiError('CSRF token 获取失败', { status: res.status })
}
