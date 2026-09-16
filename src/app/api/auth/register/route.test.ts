/**
 * 注册 API 测试
 * POST /api/auth/register
 */
import type * as httpUtils from '@/lib/utils/http'

import { register } from '@/lib/services/auth'
import { verifyAndConsumeCode } from '@/lib/services/email'

import { setAuthCookie } from '@/lib/utils/http'
import { POST } from './route'

vi.mock('@/lib/services/auth', () => ({
  register: vi.fn(),
}))

vi.mock('@/lib/services/email', () => ({
  verifyAndConsumeCode: vi.fn(),
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

  it('邮箱验证码无效时返回 400', async () => {
    vi.mocked(verifyAndConsumeCode).mockResolvedValueOnce(false)

    const req = new Request('http://localhost/api/auth/register', {
      body: JSON.stringify({
        code: '000000',
        email: 'test@example.com',
        password: 'Password123',
        username: 'test',
      }),
      method: 'POST',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.message).toBe('验证码错误或已过期')
  })

  it('邮箱验证码正确时通过校验并完成注册', async () => {
    vi.mocked(verifyAndConsumeCode).mockResolvedValueOnce(true)
    mockRegister.mockResolvedValueOnce({
      token: 'jwt-token-verified',
      user: { createdAt: '2024-01-01T00:00:00Z', id: 'u-verified', username: 'verifieduser' },
    })

    const req = new Request('http://localhost/api/auth/register', {
      body: JSON.stringify({
        code: '654321',
        email: 'verified@example.com',
        password: 'Password123',
        username: 'verifieduser',
      }),
      method: 'POST',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(verifyAndConsumeCode).toHaveBeenCalledWith('verified@example.com', '654321', 'register')
    expect(mockRegister).toHaveBeenCalledWith('verifieduser', 'Password123', 'verified@example.com')
  })
})
