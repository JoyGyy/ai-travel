import { describe, expect, it, beforeEach } from 'vitest'

import { loadItineraryCache, saveItineraryCache } from '../storage'

describe('storage 工具', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loadItineraryCache 在无缓存时返回 null', () => {
    const result = loadItineraryCache('北京', 3000, 5)
    expect(result).toBeNull()
  })

  it('saveItineraryCache 保存后可正确读取', () => {
    const data = { city: '北京', spots: ['故宫', '长城'] }
    saveItineraryCache('北京', 3000, 5, data)
    const result = loadItineraryCache('北京', 3000, 5)
    expect(result).toEqual(data)
  })

  it('不同参数的缓存相互独立', () => {
    saveItineraryCache('北京', 3000, 5, { city: '北京' })
    saveItineraryCache('上海', 5000, 3, { city: '上海' })
    expect(loadItineraryCache('北京', 3000, 5)).toEqual({ city: '北京' })
    expect(loadItineraryCache('上海', 5000, 3)).toEqual({ city: '上海' })
  })

  it('损坏的 JSON 返回 null', () => {
    const key = 'detail_北京_3000_5'
    localStorage.setItem(key, 'not-json')
    const result = loadItineraryCache('北京', 3000, 5)
    expect(result).toBeNull()
  })
})
