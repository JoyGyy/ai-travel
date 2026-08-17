/**
 * 注册 API 测试
 * POST /api/auth/register
 */
import type * as httpUtils from '@/lib/utils/http'

import { register } from '@/lib/services/auth'

import { setAuthCookie } from '@/lib/utils/http'
import { POST } from './route'

vi.mock('@/lib/services/auth', () => ({
  register: vi.fn(),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    setAuthCookie: vi.fn(),
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

const mockRegister = vi.mocked(register)

describe('pOST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('注册成功返回 token 和用户信息', async () => {
    mockRegister.mockResolvedValueOnce({
      token: 'jwt-token-new',
      user: { createdAt: '2024-01-01T00:00:00Z', id: 'u-new', username: 'newuser' },
    })

    const req = new Request('http://localhost/api/auth/register', {
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'Test1234',
        username: 'newuser',
      }),
      method: 'POST',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.token).toBe('jwt-token-new')
    expect(data.user.username).toBe('newuser')
    expect(mockRegister).toHaveBeenCalledWith('newuser', 'Test1234', 'test@example.com')
    expect(setAuthCookie).toHaveBeenCalled()
  })

  it('用户名已存在返回 500', async () => {
    mockRegister.mockRejectedValueOnce(new Error('用户名已存在'))

    const req = new Request('http://localhost/api/auth/register', {
      body: JSON.stringify({ password: 'Test1234', username: 'existing' }),
      method: 'POST',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })

  it('密码不符合策略返回 500', async () => {
    mockRegister.mockRejectedValueOnce(new Error('密码至少 8 位，包含大小写字母和数字'))

    const req = new Request('http://localhost/api/auth/register', {
      body: JSON.stringify({ password: '123', username: 'test' }),
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
