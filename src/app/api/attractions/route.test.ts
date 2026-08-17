/**
 * 景点列表 API 测试
 * GET /api/attractions
 */
import type * as httpUtils from '@/lib/utils/http'

import { GET } from './route'

vi.mock('@/lib/services/attractions/attractionService', () => ({
  listAttractions: vi.fn(),
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

import { listAttractions } from '@/lib/services/attractions/attractionService'

const mockListAttractions = vi.mocked(listAttractions)

const mockAttractions = [
  {
    city: '北京',
    coverImage: 'https://example.com/img.jpg',
    highlights: ['故宫', '长城'],
    id: 'a1',
    isFavorite: false,
    name: '故宫博物院',
    summary: '明清皇家宫殿',
    tags: ['历史', '文化'],
    ticketType: 'paid',
  },
]

describe('GET /api/attractions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('返回景点列表', async () => {
    mockListAttractions.mockResolvedValueOnce({
      cities: ['北京'],
      items: mockAttractions as never,
      tags: ['历史'],
      total: 1,
    })

    const req = new Request('http://localhost/api/attractions?city=北京')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toHaveLength(1)
    expect(data.data.items[0].name).toBe('故宫博物院')
  })

  it('支持分页参数', async () => {
    mockListAttractions.mockResolvedValueOnce({
      cities: [],
      items: [],
      tags: [],
      total: 0,
    })

    const req = new Request('http://localhost/api/attractions?page=2&pageSize=10')
    await GET(req)

    expect(mockListAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10 }),
      'u1',
    )
  })

  it('支持关键词搜索', async () => {
    mockListAttractions.mockResolvedValueOnce({
      cities: [],
      items: [],
      tags: [],
      total: 0,
    })

    const req = new Request('http://localhost/api/attractions?keyword=故宫')
    await GET(req)

    expect(mockListAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '故宫' }),
      'u1',
    )
  })
})
