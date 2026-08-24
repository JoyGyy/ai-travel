/**
 * 景点列表 API 测试
 * GET /api/attractions
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { listAttractions } from '@/lib/services/attractions/attractionService'
import { getAuthFromHeaders } from '@/lib/services/auth'

import { GET } from './route'

vi.mock('@/lib/services/attractions/attractionService', () => ({
  listAttractions: vi.fn(),
}))

vi.mock('@/lib/services/auth', () => ({
  getAuthFromHeaders: vi.fn().mockResolvedValue({ id: 'u1', username: 'testuser' }),
}))

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

describe('gET /api/attractions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getAuthFromHeaders).mockResolvedValue({ id: 'u1', username: 'testuser' })
  })

  it('返回景点列表', async () => {
    mockListAttractions.mockResolvedValueOnce({
      cities: ['北京'],
      items: mockAttractions as never,
      tags: ['历史'],
      total: 1,
    })

    const req = new Request('http://localhost/api/attractions')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.items).toEqual(mockAttractions)
    expect(data.data.total).toBe(1)
  })

  it('支持筛选参数', async () => {
    mockListAttractions.mockResolvedValueOnce({
      cities: ['北京'],
      items: mockAttractions as never,
      tags: ['历史'],
      total: 1,
    })

    const req = new Request(
      'http://localhost/api/attractions?city=北京&tag=历史&ticketType=paid&page=1&pageSize=10&keyword=故宫',
    )
    await GET(req)

    expect(mockListAttractions).toHaveBeenCalledWith(
      {
        city: '北京',
        keyword: '故宫',
        page: 1,
        pageSize: 10,
        tag: '历史',
        ticketType: 'paid',
      },
      'u1',
    )
  })

  it('游客未登录时返回景点列表且 userId 为 undefined', async () => {
    vi.mocked(getAuthFromHeaders).mockResolvedValueOnce(null)
    mockListAttractions.mockResolvedValueOnce({
      cities: ['北京'],
      items: mockAttractions as never,
      tags: ['历史'],
      total: 1,
    })

    const req = new Request('http://localhost/api/attractions')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.success).toBe(true)
    expect(mockListAttractions).toHaveBeenCalledWith(expect.any(Object), undefined)
  })

  it('无效的分页参数返回 400 格式错误', async () => {
    const req = new Request('http://localhost/api/attractions?page=-1')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('无效的 ticketType 被忽略', async () => {
    mockListAttractions.mockResolvedValueOnce({
      cities: [],
      items: [],
      tags: [],
      total: 0,
    })

    const req = new Request('http://localhost/api/attractions?ticketType=invalid')
    await GET(req)

    expect(mockListAttractions).toHaveBeenCalledWith(
      expect.objectContaining({ ticketType: '' }),
      'u1',
    )
  })

  it('服务抛错返回 500', async () => {
    mockListAttractions.mockRejectedValueOnce(new Error('数据库连接失败'))

    const req = new Request('http://localhost/api/attractions')
    const res = await GET(req)
    const data = await res.json()

    expect(res.status).toBe(500)
    expect(data.success).toBe(false)
  })
})
