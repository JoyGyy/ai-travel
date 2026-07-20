import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

test('search_product_attractions 按城市和免费类型返回产品景点详情入口', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'travel-chat-attractions-tool-'))
  process.env.JWT_SECRET = 'test-secret-for-chat-attractions-tool-123456'
  process.env.USERS_DB_PATH = path.join(dir, 'users.db')

  try {
    const chatUrl = new URL('./chat.js', import.meta.url)
    chatUrl.searchParams.set('case', String(Date.now()))
    const { executeChatToolForTest } = await import(chatUrl.href)

    const raw = executeChatToolForTest('search_product_attractions', { city: '杭州', ticketType: 'free' })
    const result = JSON.parse(raw)

    assert.equal(result.city, '杭州')
    assert.ok(result.attractions.some(item => item.id === 'hangzhou-west-lake'))
    assert.ok(result.attractions.every(item => item.detailPath.startsWith('/attractions/')))
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
