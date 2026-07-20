import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

test('从行程点位名称匹配产品景点引用并去重', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'travel-attraction-matcher-'))
  process.env.JWT_SECRET = 'test-secret-for-attraction-matcher-123456'
  process.env.USERS_DB_PATH = path.join(dir, 'users.db')

  try {
    const matcherUrl = new URL('./attractionMatcher.js', import.meta.url)
    matcherUrl.searchParams.set('case', String(Date.now()))
    const { matchAttractionRefsFromItinerary } = await import(matcherUrl.href)

    const refs = matchAttractionRefsFromItinerary([
      { day: 1, morning: { spot: '西湖' }, afternoon: { spot: '灵隐寺' }, evening: { spot: '西湖' } },
    ])

    assert.deepEqual(refs.map(item => item.id), ['hangzhou-west-lake', 'hangzhou-lingyin-temple'])
    assert.equal(refs[0].priceText, '免费开放，部分景点另收费')
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
