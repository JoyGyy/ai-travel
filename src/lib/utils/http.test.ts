import { generateCsrfToken } from './csrf'
import { withProtectedRaw } from './http'

const checkRateLimit = vi.fn(async (..._args: unknown[]) => null)

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: (req: Request, name: string, max: number, windowMs?: number, userId?: string) =>
    checkRateLimit(req, name, max, windowMs, userId),
}))

vi.mock('@/lib/services/auth', () => ({
  getAuthFromHeaders: vi.fn(async () => ({ id: 'user-1', username: 'tester' })),
}))

describe('withProtectedRaw', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('拒绝缺少 CSRF token 的流式写请求', async () => {
    const handler = vi.fn(async () => new Response('ok'))
    const route = withProtectedRaw(handler, {
      rateLimit: { max: 1, name: 'test:stream' },
    })

    const response = await route(new Request('http://localhost/api/test', { method: 'POST' }))

    expect(response.status).toBe(403)
    expect(handler).not.toHaveBeenCalled()
  })

  it('使用用户 ID 限流后执行处理器', async () => {
    const handler = vi.fn(async () => new Response('ok'))
    const route = withProtectedRaw(handler, {
      rateLimit: { max: 1, name: 'test:stream' },
    })
    const token = generateCsrfToken()
    const response = await route(new Request('http://localhost/api/test', {
      headers: { 'cookie': `csrf_token=${token}`, 'X-CSRF-Token': token },
      method: 'POST',
    }))

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalled()
    expect(checkRateLimit).toHaveBeenCalledWith(expect.any(Request), 'test:stream', 1, undefined, 'user-1')
  })

  it('允许携带 Bearer Token 的移动端原生请求免除 CSRF 检查', async () => {
    const handler = vi.fn(async () => new Response('ok'))
    const route = withProtectedRaw(handler, {
      rateLimit: { max: 1, name: 'test:stream' },
    })
    const response = await route(new Request('http://localhost/api/test', {
      headers: { authorization: 'Bearer valid-mobile-token' },
      method: 'POST',
    }))

    expect(response.status).toBe(200)
    expect(handler).toHaveBeenCalled()
  })
})

describe('errorResponse', () => {
  it('保留业务错误的 429 状态和配额信息', async () => {
    const { errorResponse } = await import('./http')
    const error = Object.assign(new Error('今日 AI 使用次数已达上限，请明天再试'), {
      quota: { limit: 10, remaining: 0, used: 10 },
      status: 429,
    })
    const response = errorResponse(error)

    expect(response.status).toBe(429)
    expect(await response.json()).toMatchObject({ quota: { remaining: 0 }, success: false })
  })
})
