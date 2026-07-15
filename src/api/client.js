const AUTH_STORAGE_KEY = 'travel_auth'

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

function readPersistedToken() {
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

export function getAuthHeader() {
  const token = readPersistedToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseResponse(res) {
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json'))
    return null

  try {
    return await res.json()
  }
  catch {
    return null
  }
}

export async function request(path, options = {}) {
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

  const data = await parseResponse(res)

  if (!res.ok || data?.success === false) {
    const message = data?.message || data?.error || `请求失败: HTTP ${res.status}`
    throw new ApiError(message, { status: res.status, data })
  }

  return data
}
