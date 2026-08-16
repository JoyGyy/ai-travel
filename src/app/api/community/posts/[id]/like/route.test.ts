/**
 * 社区帖子点赞 API 测试
 * POST /api/community/posts/[id]/like — 点赞
 * DELETE /api/community/posts/[id]/like — 取消点赞
 */
import type * as httpUtils from '@/lib/utils/http'

import { DELETE, POST } from './route'

vi.mock('@/lib/services/community', () => ({
  likeCommunityPost: vi.fn(),
  unlikeCommunityPost: vi.fn(),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    withProtected:
      (handler: (req: Request, ctx: { params: Promise<{ id: string }>; user: { id: string; username: string } }) => Promise<Response>) =>
        async (req: Request, ctx: unknown) => {
          try {
            return await handler(req, {
              ...(ctx as object),
              user: { id: 'u1', username: 'testuser' },
            } as { params: Promise<{ id: string }>; user: { id: string; username: string } })
          } catch (err) {
            return actual.errorResponse(err)
          }
        },
  }
})

import { likeCommunityPost, unlikeCommunityPost } from '@/lib/services/community'

const mockLike = vi.mocked(likeCommunityPost)
const mockUnlike = vi.mocked(unlikeCommunityPost)

describe('社区帖子点赞 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/community/posts/[id]/like', () => {
    it('点赞成功', async () => {
      mockLike.mockResolvedValueOnce({
        likeCount: 6,
        likedByMe: true,
      })

      const req = new Request('http://localhost/api/community/posts/p1/like', { method: 'POST' })
      const res = await POST(req, { params: Promise.resolve({ id: 'p1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('已点赞')
      expect(mockLike).toHaveBeenCalledWith('p1', 'u1')
    })
  })

  describe('DELETE /api/community/posts/[id]/like', () => {
    it('取消点赞成功', async () => {
      mockUnlike.mockResolvedValueOnce({
        likeCount: 4,
        likedByMe: false,
      })

      const req = new Request('http://localhost/api/community/posts/p1/like', { method: 'DELETE' })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'p1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('已取消点赞')
      expect(mockUnlike).toHaveBeenCalledWith('p1', 'u1')
    })
  })
})
