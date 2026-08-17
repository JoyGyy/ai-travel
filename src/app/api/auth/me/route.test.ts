/**
 * 获取当前用户信息 API 测试
 * GET /api/auth/me
 */
import type * as httpUtils from '@/lib/utils/http'

import { GET } from './route'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    withAuth:
      (
        handler: (
          req: Request,
          ctx: { user: { id: string; username: string } },
        ) => Promise<Response>,
      ) =>
      async (req: Request) => {
        try {
          return await handler(req, { user: { id: 'u1', username: 'testuser' } })
        } catch (err) {
          return actual.errorResponse(err)
        }
      },
  }
})

import { query } from '@/lib/db'

const mockQuery = vi.mocked(query)

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('用户存在返回用户信息', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ created_at: new Date('2024-01-01'), id: 'u1', username: 'testuser' }],
    } as never)

    const req = new Request('http://localhost/api/auth/me')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user.id).toBe('u1')
    expect(data.user.username).toBe('testuser')
    expect(data.user.createdAt).toBeDefined()
  })

  it('用户不存在返回 401', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never)

    const req = new Request('http://localhost/api/auth/me')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.message).toBe('用户不存在')
  })
})
