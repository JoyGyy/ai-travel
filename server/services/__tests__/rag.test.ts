import { describe, expect, it } from 'vitest'
import { retrieve, getAllCities, getCityData } from '../rag'

describe('RAG 检索服务', () => {
  describe('getAllCities', () => {
    it('应返回所有城市列表', () => {
      const cities = getAllCities()
      expect(cities.length).toBeGreaterThan(0)
      expect(cities).toContain('杭州')
      expect(cities).toContain('北京')
      expect(cities).toContain('上海')
    })
  })

  describe('getCityData', () => {
    it('应返回指定城市的数据', () => {
      const data = getCityData('杭州') as any
      expect(data).not.toBeNull()
      expect(data.city).toBe('杭州')
      expect(data.attractions.length).toBeGreaterThan(0)
      expect(data.food.length).toBeGreaterThan(0)
    })

    it('不存在的城市应返回 null', () => {
      expect(getCityData('火星')).toBeNull()
    })
  })

  describe('retrieve', () => {
    it('应返回城市景点和附加信息', () => {
      const result = retrieve('杭州') as any
      expect(result).not.toBeNull()
      expect(result.city).toBe('杭州')
      expect(result.attractions.length).toBeGreaterThan(0)
      expect(result.food).toBeDefined()
      expect(result.bestSeason).toBeDefined()
    })

    it('不存在的城市应返回 null', () => {
      expect(retrieve('火星')).toBeNull()
    })

    it('精确查询"西湖"应排在第一位', () => {
      const result = retrieve('杭州', [], '西湖') as any
      expect(result).not.toBeNull()
      expect(result.attractions[0].name).toBe('西湖')
    })

    it('精确查询"灵隐寺"应排在前列', () => {
      const result = retrieve('杭州', [], '灵隐寺') as any
      expect(result).not.toBeNull()
      const topNames = result.attractions.slice(0, 3).map((a: any) => a.name)
      expect(topNames).toContain('灵隐寺')
    })

    it('偏好标签"必去"应影响排序', () => {
      const result = retrieve('杭州', ['必去']) as any
      expect(result).not.toBeNull()
      const topTags = result.attractions.slice(0, 3).flatMap((a: any) => a.tags)
      expect(topTags).toContain('必去')
    })

    it('语义查询"古寺"应匹配到灵隐寺', () => {
      const result = retrieve('杭州', [], '古寺') as any
      expect(result).not.toBeNull()
      const topNames = result.attractions.slice(0, 3).map((a: any) => a.name)
      expect(topNames).toContain('灵隐寺')
    })

    it('语义查询"美食街"应匹配到河坊街', () => {
      const result = retrieve('杭州', [], '美食街') as any
      expect(result).not.toBeNull()
      const topNames = result.attractions.slice(0, 5).map((a: any) => a.name)
      expect(topNames).toContain('河坊街')
    })

    it('空查询应返回所有景点（按默认排序）', () => {
      const result = retrieve('杭州', [], '') as any
      expect(result).not.toBeNull()
      expect(result.attractions.length).toBeGreaterThan(0)
    })
  })
})
