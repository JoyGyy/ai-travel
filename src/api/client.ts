import type { ApiSuccess } from '@/types/api'

const AUTH_STORAGE_KEY = 'travel_auth'

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

  const res = await fetch(path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(auth ? getAuthHeader() : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  const data = await parseResponse<T>(res)

  if (!res.ok) {
    const fallback = data && typeof data === 'object' ? data as Record<string, unknown> : {}
    const message = (fallback.message as string) || (fallback.error as string) || `请求失败: HTTP ${res.status}`
    throw new ApiError(message, { status: res.status, data })
  }

  return data as T
}
