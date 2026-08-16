/**
 * 社区帖子 API 测试
 * GET /api/community/posts — 帖子列表
 * POST /api/community/posts — 创建帖子
 */
import { GET, POST } from './route'

vi.mock('@/lib/services/community', () => ({
  createCommunityPost: vi.fn(),
  listCommunityPosts: vi.fn(),
}))

vi.mock('@/lib/services/auth', () => ({
  getAuthFromHeaders: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => null),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/utils/http')>()
  return {
    ...actual,
    withProtected: (handler: Function) => async (req: Request) => {
      try {
        return await handler(req, { user: { id: 'u1', username: 'testuser' } })
      } catch (err) {
        return actual.errorResponse(err)
      }
    },
  }
})

import { getAuthFromHeaders } from '@/lib/services/auth'
import { createCommunityPost, listCommunityPosts } from '@/lib/services/community'

const mockListPosts = vi.mocked(listCommunityPosts)
const mockCreatePost = vi.mocked(createCommunityPost)
const mockGetAuth = vi.mocked(getAuthFromHeaders)

const mockPosts = [
  {
    author: { id: 'u1', username: 'testuser' },
    city: '北京',
    commentCount: 2,
    content: '北京三日游攻略',
    createdAt: '2024-01-01T00:00:00Z',
    id: 'p1',
    images: [],
    itinerarySnapshot: null,
    likeCount: 5,
    likedByMe: false,
    originalPost: null,
    postType: 'original' as const,
    repostCount: 0,
    title: '北京之行',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

describe('社区帖子 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/community/posts', () => {
    it('返回帖子列表', async () => {
      mockGetAuth.mockResolvedValueOnce(null)
      mockListPosts.mockResolvedValueOnce({
        items: mockPosts,
        page: 1,
        pageSize: 10,
        total: 1,
      })

      const req = new Request('http://localhost/api/community/posts')
      const res = await GET(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.items).toHaveLength(1)
      expect(data.data.items[0].title).toBe('北京之行')
    })

    it('支持分页参数', async () => {
      mockGetAuth.mockResolvedValueOnce(null)
      mockListPosts.mockResolvedValueOnce({
        items: [],
        page: 2,
        pageSize: 5,
        total: 0,
      })

      const req = new Request('http://localhost/api/community/posts?page=2&pageSize=5')
      await GET(req)

      expect(mockListPosts).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, pageSize: 5 }),
        undefined,
      )
    })

    it('登录用户传递 viewerId', async () => {
      mockGetAuth.mockResolvedValueOnce({ id: 'u1', username: 'testuser' })
      mockListPosts.mockResolvedValueOnce({
        items: [],
        page: 1,
        pageSize: 10,
        total: 0,
      })

      const req = new Request('http://localhost/api/community/posts')
      await GET(req)

      expect(mockListPosts).toHaveBeenCalledWith(expect.anything(), 'u1')
    })
  })

  describe('POST /api/community/posts', () => {
    it('创建帖子成功', async () => {
      mockCreatePost.mockResolvedValueOnce({
        author: { id: 'u1', username: 'testuser' },
        city: '',
        commentCount: 0,
        content: '新帖子内容',
        createdAt: '2024-01-01T00:00:00Z',
        id: 'p-new',
        images: [],
        itinerarySnapshot: null,
        likeCount: 0,
        likedByMe: false,
        originalPost: null,
        postType: 'original',
        repostCount: 0,
        title: '新帖子',
        updatedAt: '2024-01-01T00:00:00Z',
      })

      const req = new Request('http://localhost/api/community/posts', {
        body: JSON.stringify({ content: '新帖子内容', title: '新帖子' }),
        method: 'POST',
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('已发布到社区')
      expect(mockCreatePost).toHaveBeenCalledWith('u1', expect.objectContaining({
        content: '新帖子内容',
        title: '新帖子',
      }))
    })

    it('缺少内容和图片时返回 400', async () => {
      const req = new Request('http://localhost/api/community/posts', {
        body: JSON.stringify({ title: '空帖子' }),
        method: 'POST',
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.success).toBe(false)
    })
  })
})
