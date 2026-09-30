/**
 * 获取当前用户信息 API 测试
 * GET /api/auth/me
 */
import { query } from '@/lib/db'
import { getAuthFromHeaders } from '@/lib/services/auth'

import { GET } from './route'

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}))

vi.mock('@/lib/services/auth', () => ({
  getAuthFromHeaders: vi.fn(),
}))

const mockQuery = vi.mocked(query)
const mockGetAuth = vi.mocked(getAuthFromHeaders)

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('用户存在返回用户信息', async () => {
    mockGetAuth.mockResolvedValueOnce({
      id: 'u1',
      username: 'testuser',
    })
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

  it('未登录时返回 200 且 user 为 null', async () => {
    mockGetAuth.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/auth/me')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toBeNull()
  })

  it('用户在数据库中不存在时清除 Cookie 并返回 user 为 null', async () => {
    mockGetAuth.mockResolvedValueOnce({
      id: 'deleted-user',
      username: 'ghost',
    })
    mockQuery.mockResolvedValueOnce({ rows: [] } as never)

    const req = new Request('http://localhost/api/auth/me')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.user).toBeNull()
    expect(res.headers.get('set-cookie')).toContain('token=;')
  })
})
