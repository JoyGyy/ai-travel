import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  favoriteAttraction,
  fetchAttractionDetail,
  fetchAttractions,
  fetchFavoriteAttractions,
  unfavoriteAttraction,
} from '../attractions'

describe('attractions api', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  function mockFetch(data: unknown) {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => data,
    })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('fetchAttractions 会携带筛选参数和登录头', async () => {
    localStorage.setItem('travel_auth', JSON.stringify({ state: { token: 'token-1' } }))
    const fetchMock = mockFetch({ success: true, data: { items: [], total: 0, cities: [], tags: [] } })

    await fetchAttractions({ city: '北京', ticketType: 'free', keyword: '博物馆', tag: '历史' })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/attractions?city=%E5%8C%97%E4%BA%AC&ticketType=free&keyword=%E5%8D%9A%E7%89%A9%E9%A6%86&tag=%E5%8E%86%E5%8F%B2',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-1' }) }),
    )
  })

  it('fetchAttractionDetail 返回详情 data', async () => {
    mockFetch({ success: true, data: { attraction: { id: 'hangzhou-west-lake' }, isFavorite: true } })

    const data = await fetchAttractionDetail('hangzhou-west-lake')

    expect(data.isFavorite).toBe(true)
    expect(data.attraction.id).toBe('hangzhou-west-lake')
  })

  it('fetchFavoriteAttractions 会请求收藏列表并携带 Authorization header', async () => {
    localStorage.setItem('travel_auth', JSON.stringify({ state: { token: 'token-2' } }))
    const fetchMock = mockFetch({ success: true, data: { items: [], total: 0, cities: [], tags: [] } })

    const data = await fetchFavoriteAttractions()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/attractions/favorites',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer token-2' }) }),
    )
    expect(data.items).toEqual([])
  })

  it('favoriteAttraction 和 unfavoriteAttraction 使用正确方法', async () => {
    const fetchMock = mockFetch({ success: true, data: { isFavorite: true } })

    await favoriteAttraction('xian-city-wall')
    await unfavoriteAttraction('xian-city-wall')

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/attractions/xian-city-wall/favorite', expect.objectContaining({ method: 'POST' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/attractions/xian-city-wall/favorite', expect.objectContaining({ method: 'DELETE' }))
  })
})
