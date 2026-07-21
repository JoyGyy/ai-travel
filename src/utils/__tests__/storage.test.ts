import { beforeEach, describe, expect, it } from 'vitest'

import { loadItineraryCache, saveItineraryCache } from '../storage'

/** 构建符合 ItineraryCache 接口的最小测试数据 */
function makeCacheData(overrides: Partial<ReturnType<typeof loadItineraryCache>> = {}) {
  return {
    itinerary: [],
    budgetBreakdown: null,
    tips: [],
    weather: null,
    accommodation: [],
    nightlife: [],
    attractionRefs: [],
    ...overrides,
  }
}

describe('storage 工具', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadItineraryCache 在无缓存时返回 null', () => {
    const result = loadItineraryCache('北京', 3000, 5)
    expect(result).toBeNull()
  })

  it('saveItineraryCache 保存后可正确读取', () => {
    const data = makeCacheData({ tips: ['带好防晒霜'] })
    saveItineraryCache('北京', 3000, 5, data)
    const result = loadItineraryCache('北京', 3000, 5)
    expect(result).toEqual(data)
  })

  it('不同参数的缓存相互独立', () => {
    const bj = makeCacheData({ tips: ['北京提示'] })
    const sh = makeCacheData({ tips: ['上海提示'] })
    saveItineraryCache('北京', 3000, 5, bj)
    saveItineraryCache('上海', 5000, 3, sh)
    expect(loadItineraryCache('北京', 3000, 5)).toEqual(bj)
    expect(loadItineraryCache('上海', 5000, 3)).toEqual(sh)
  })

  it('损坏的 JSON 返回 null', () => {
    const key = 'detail_北京_3000_5'
    localStorage.setItem(key, 'not-json')
    const result = loadItineraryCache('北京', 3000, 5)
    expect(result).toBeNull()
  })
})
