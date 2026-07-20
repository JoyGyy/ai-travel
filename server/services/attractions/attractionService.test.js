import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

async function importModulesWithTempDb(name) {
  const dir = await mkdtemp(path.join(tmpdir(), `travel-attractions-service-${name}-`))
  process.env.JWT_SECRET = 'test-secret-for-attractions-service-123456'
  process.env.USERS_DB_PATH = path.join(dir, 'users.db')

  const authUrl = new URL('../auth.js', import.meta.url)
  authUrl.searchParams.set('case', `${name}-${Date.now()}`)
  const auth = await import(authUrl.href)

  const serviceUrl = new URL('./attractionService.js', import.meta.url)
  serviceUrl.searchParams.set('case', `${name}-${Date.now()}`)
  const service = await import(serviceUrl.href)

  return { auth, service, dir }
}

test('列表和详情会带上当前用户收藏状态', async () => {
  const { auth, service, dir } = await importModulesWithTempDb('favorite-state')
  try {
    const result = await auth.register('favoriteUser', '123456')
    await service.favoriteAttraction(result.user.id, 'hangzhou-west-lake')

    const list = await service.listAttractions({ city: '杭州', ticketType: 'free' }, result.user.id)
    const westLake = list.items.find(item => item.id === 'hangzhou-west-lake')
    assert.equal(westLake.isFavorite, true)

    const detail = await service.getAttractionById('hangzhou-west-lake', result.user.id)
    assert.equal(detail.isFavorite, true)
    assert.equal(detail.attraction.name, '西湖')
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('收藏不存在的景点会抛出 404 状态错误', async () => {
  const { auth, service, dir } = await importModulesWithTempDb('missing')
  try {
    const result = await auth.register('missingUser', '123456')
    await assert.rejects(
      () => service.favoriteAttraction(result.user.id, 'missing-attraction'),
      err => err.status === 404 && err.message === '景点不存在',
    )
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
