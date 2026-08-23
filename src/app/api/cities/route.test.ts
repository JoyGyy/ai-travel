/**
 * 城市搜索 API 测试
 * GET /api/cities
 */
import { searchCities } from '@/lib/services/cityService'

import { GET } from './route'

vi.mock('@/lib/services/cityService', () => ({
  searchCities: vi.fn(),
}))

const mockSearchCities = vi.mocked(searchCities)

describe('get /api/cities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchCities.mockResolvedValue([])
  })

  it('没有关键词时不调用搜索服务', async () => {
    const res = await GET(new Request('http://localhost/api/cities'))
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data).toMatchObject({ data: [], success: true })
    expect(mockSearchCities).not.toHaveBeenCalled()
  })

  it.each([
    ['subdistrict=-1', '子级数量必须是 0-5 之间的整数'],
    ['subdistrict=6', '子级数量必须是 0-5 之间的整数'],
    ['subdistrict=abc', '子级数量必须是 0-5 之间的整数'],
  ])('拒绝非法子级数量：%s', async (query, message) => {
    const res = await GET(new Request(`http://localhost/api/cities?keyword=北京&${query}`))
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(data).toMatchObject({ message, success: false })
    expect(mockSearchCities).not.toHaveBeenCalled()
  })

  it('传递合法子级数量', async () => {
    await GET(new Request('http://localhost/api/cities?keyword=北京&subdistrict=2'))

    expect(mockSearchCities).toHaveBeenCalledWith('北京', 2)
  })
})
