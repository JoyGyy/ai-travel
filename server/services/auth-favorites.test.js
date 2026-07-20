import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

async function importAuthWithTempDb() {
  const dir = await mkdtemp(path.join(tmpdir(), 'travel-auth-favorites-'))
  process.env.JWT_SECRET = 'test-secret-for-attractions-favorites-123456'
  process.env.USERS_DB_PATH = path.join(dir, 'users.db')
  const url = new URL('./auth.js', import.meta.url)
  url.searchParams.set('case', String(Date.now()))
  const auth = await import(url.href)
  return { auth, dir }
}

test('用户收藏景点会按用户隔离并保持幂等', async () => {
  const { auth, dir } = await importAuthWithTempDb()
  try {
    const userA = await auth.register('userA', '123456')
    const userB = await auth.register('userB', '123456')

    await auth.addFavoriteAttraction(userA.user.id, 'beijing-palace-museum')
    await auth.addFavoriteAttraction(userA.user.id, 'beijing-palace-museum')
    await auth.addFavoriteAttraction(userB.user.id, 'hangzhou-west-lake')

    assert.deepEqual(await auth.listFavoriteAttractionIds(userA.user.id), ['beijing-palace-museum'])
    assert.deepEqual(await auth.listFavoriteAttractionIds(userB.user.id), ['hangzhou-west-lake'])

    await auth.removeFavoriteAttraction(userA.user.id, 'beijing-palace-museum')
    await auth.removeFavoriteAttraction(userA.user.id, 'beijing-palace-museum')

    assert.deepEqual(await auth.listFavoriteAttractionIds(userA.user.id), [])
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
