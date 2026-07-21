import assert from 'node:assert/strict'
import { it } from 'vitest'

// 需要 DATABASE_URL 才能运行
const skip = !process.env.DATABASE_URL

it('从行程点位名称匹配产品景点引用并去重', { skip }, async () => {
  const { matchAttractionRefsFromItinerary } = await import('./attractionMatcher.js')

  const refs = await matchAttractionRefsFromItinerary([
    { day: 1, morning: { spot: '西湖' }, afternoon: { spot: '灵隐寺' }, evening: { spot: '西湖' } },
  ])

  assert.deepEqual(refs.map(item => item.id), ['hangzhou-west-lake', 'hangzhou-lingyin-temple'])
  assert.equal(refs[0].priceText, '免费开放，部分景点另收费')
})
