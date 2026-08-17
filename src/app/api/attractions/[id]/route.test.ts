/**
 * 景点详情 API 测试
 * GET /api/attractions/[id]
 */
import type * as httpUtils from '@/lib/utils/http'

import { GET } from './route'

vi.mock('@/lib/services/attractions/attractionService', () => ({
  getAttractionById: vi.fn(),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    withAuth:
      (
        handler: (
          req: Request,
          ctx: { params: Promise<{ id: string }>; user: { id: string; username: string } },
        ) => Promise<Response>,
      ) =>
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

import { getAttractionById } from '@/lib/services/attractions/attractionService'

const mockGetAttractionById = vi.mocked(getAttractionById)

const mockAttraction = {
  address: '北京市东城区景山前街4号',
  aliases: ['紫禁城'],
  bookingLinks: {},
  city: '北京',
  coverImage: 'https://example.com/forbidden-city.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  description: '明清两代的皇家宫殿',
  highlights: ['太和殿', '御花园'],
  id: 'a1',
  isFavorite: true,
  name: '故宫博物院',
  openingHours: '08:30-17:00',
  priceText: '60元',
  recommendedDuration: '4小时',
  suitableFor: ['文化爱好者', '摄影爱好者'],
  summary: '世界文化遗产',
  tags: ['历史', '文化', '建筑'],
  ticketType: 'paid',
  tips: ['需要提前预约', '周一闭馆'],
  updatedAt: '2024-01-01T00:00:00Z',
}

describe('GET /api/attractions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('景点存在返回详情', async () => {
    mockGetAttractionById.mockResolvedValueOnce(mockAttraction as never)

    const req = new Request('http://localhost/api/attractions/a1')
    const res = await GET(req, { params: Promise.resolve({ id: 'a1' }) })
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.name).toBe('故宫博物院')
    expect(data.data.city).toBe('北京')
    expect(data.data.isFavorite).toBe(true)
  })

  it('景点不存在返回 404', async () => {
    mockGetAttractionById.mockResolvedValueOnce(null)

    const req = new Request('http://localhost/api/attractions/nonexistent')
    const res = await GET(req, { params: Promise.resolve({ id: 'nonexistent' }) })
    const data = await res.json()

    expect(res.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.message).toBe('景点不存在')
  })
})
