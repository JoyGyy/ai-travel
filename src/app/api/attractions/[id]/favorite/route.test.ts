/**
 * 景点收藏 API 测试
 * POST /api/attractions/[id]/favorite — 收藏
 * DELETE /api/attractions/[id]/favorite — 取消收藏
 */
import type * as httpUtils from '@/lib/utils/http'

import { DELETE, POST } from './route'

vi.mock('@/lib/services/attractions/attractionService', () => ({
  favoriteAttraction: vi.fn(),
  unfavoriteAttraction: vi.fn(),
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

import {
  favoriteAttraction,
  unfavoriteAttraction,
} from '@/lib/services/attractions/attractionService'

const mockFavorite = vi.mocked(favoriteAttraction)
const mockUnfavorite = vi.mocked(unfavoriteAttraction)

describe('景点收藏 API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/attractions/[id]/favorite', () => {
    it('收藏成功返回成功消息', async () => {
      mockFavorite.mockResolvedValueOnce({
        isFavorite: true,
      })

      const req = new Request('http://localhost/api/attractions/a1/favorite', { method: 'POST' })
      const res = await POST(req, { params: Promise.resolve({ id: 'a1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('已收藏')
      expect(mockFavorite).toHaveBeenCalledWith('u1', 'a1')
    })
  })

  describe('DELETE /api/attractions/[id]/favorite', () => {
    it('取消收藏返回成功消息', async () => {
      mockUnfavorite.mockResolvedValueOnce({
        isFavorite: false,
      })

      const req = new Request('http://localhost/api/attractions/a1/favorite', { method: 'DELETE' })
      const res = await DELETE(req, { params: Promise.resolve({ id: 'a1' }) })
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('已取消收藏')
      expect(mockUnfavorite).toHaveBeenCalledWith('u1', 'a1')
    })
  })
})
