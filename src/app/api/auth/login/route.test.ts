/**
 * 登录 API 测试
 * POST /api/auth/login
 */
import type * as httpUtils from '@/lib/utils/http'

import { login } from '@/lib/services/auth'

import { setAuthCookie } from '@/lib/utils/http'
import { POST } from './route'

vi.mock('@/lib/services/auth', () => ({
  login: vi.fn(),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    setAuthCookie: vi.fn(),
    // 绕过限流和 CSRF，但保留错误处理
    withPublicPost:
      (
        _name: string,
        _max: number,
        _windowMs: number,
        handler: (req: Request) => Promise<Response>,
      ) =>
        async (req: Request) => {
          try {
            return await handler(req)
          }
          catch (err) {
            return actual.errorResponse(err)
          }
        },
  }
})

const mockLogin = vi.mocked(login)

describe('pOST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('登录成功返回 token 和用户信息', async () => {
    mockLogin.mockResolvedValueOnce({
      token: 'jwt-token-123',
      user: { createdAt: '2024-01-01T00:00:00Z', id: 'u1', username: 'testuser' },
    })

    const req = new Request('http://localhost/api/auth/login', {
      body: JSON.stringify({ password: 'Test1234', username: 'testuser' }),
      method: 'POST',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.token).toBe('jwt-token-123')
    expect(data.user.username).toBe('testuser')
    expect(mockLogin).toHaveBeenCalledWith('testuser', 'Test1234')
    expect(setAuthCookie).toHaveBeenCalled()
  })

  it('用户名或密码错误返回 401', async () => {
    mockLogin.mockRejectedValueOnce(new Error('用户名或密码错误'))

    const req = new Request('http://localhost/api/auth/login', {
      body: JSON.stringify({ password: 'wrong', username: 'testuser' }),
      method: 'POST',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.success).toBe(false)
  })

  it('缺少参数时抛出错误', async () => {
    mockLogin.mockRejectedValueOnce(new Error('参数不完整'))

    const req = new Request('http://localhost/api/auth/login', {
      body: JSON.stringify({}),
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
