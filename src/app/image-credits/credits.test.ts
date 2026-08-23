import { describe, expect, it } from 'vitest'

import attractionCredits from '@/knowledge/attraction-image-credits.json'
import attractions from '@/knowledge/attractions-product.json'
import { buildCreditsByCity } from '@/lib/credits'

describe('图片版权数据', () => {
  it('版权记录恰好覆盖 60 个景点', () => {
    expect(attractionCredits).toHaveLength(60)
    expect(attractions).toHaveLength(60)
  })

  it('每条版权记录对应一个存在的景点', () => {
    const ids = new Set(attractions.map(attraction => attraction.id))
    for (const credit of attractionCredits) {
      expect(ids.has(credit.attractionId)).toBe(true)
    }
  })

  it('按城市分组后总条数为 60', () => {
    const byCity = buildCreditsByCity()
    const total = byCity.reduce((sum, group) => sum + group.items.length, 0)
    expect(total).toBe(60)
  })

  it('每条版权记录包含作者、来源与许可信息', () => {
    for (const credit of attractionCredits) {
      expect(credit.author.trim()).toBeTruthy()
      expect(credit.sourcePage.startsWith('http')).toBe(true)
      expect(credit.license.trim()).toBeTruthy()
      expect(credit.verified).toBe(true)
    }
  })
})
