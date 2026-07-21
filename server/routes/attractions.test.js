import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import express from 'express'
import { it } from 'vitest'

async function createTestApp() {
  const dir = await mkdtemp(path.join(tmpdir(), 'travel-attractions-routes-'))
  process.env.JWT_SECRET = 'test-secret-for-attractions-routes-123456'
  process.env.USERS_DB_PATH = path.join(dir, 'users.db')

  const authUrl = new URL('../services/auth.js', import.meta.url)
  authUrl.searchParams.set('case', String(Date.now()))
  const auth = await import(authUrl.href)

  const routeUrl = new URL('./attractions.js', import.meta.url)
  routeUrl.searchParams.set('case', String(Date.now()))
  const routes = await import(routeUrl.href)

  const app = express()
  app.use(express.json())
  app.use('/api/attractions', routes.default)
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ success: false, message: err.message })
  })

  const registered = await auth.register('routeUser', '123456')
  const headers = { Authorization: `Bearer ${registered.token}` }
  return { app, headers, dir }
}

async function request(app, path, options = {}) {
  const server = app.listen(0)
  try {
    const { port } = server.address()
    const res = await fetch(`http://127.0.0.1:${port}${path}`, options)
    const data = await res.json()
    return { status: res.status, data }
  }
  finally {
    server.close()
  }
}

it('景点接口要求登录并支持列表、详情、收藏', async () => {
  const { app, headers, dir } = await createTestApp()
  try {
    const unauthorized = await request(app, '/api/attractions')
    assert.equal(unauthorized.status, 401)

    const list = await request(app, '/api/attractions?city=北京&ticketType=free', { headers })
    assert.equal(list.status, 200)
    assert.equal(list.data.success, true)
    assert.equal(list.data.data.items[0].city, '北京')

    const favorite = await request(app, '/api/attractions/beijing-national-museum/favorite', {
      method: 'POST',
      headers,
    })
    assert.equal(favorite.status, 200)
    assert.equal(favorite.data.data.isFavorite, true)

    const detail = await request(app, '/api/attractions/beijing-national-museum', { headers })
    assert.equal(detail.status, 200)
    assert.equal(detail.data.data.isFavorite, true)

    const favorites = await request(app, '/api/attractions/favorites', { headers })
    assert.equal(favorites.data.data.items.length, 1)
    assert.equal(favorites.data.data.items[0].id, 'beijing-national-museum')
  }
  finally {
    await rm(dir, { recursive: true, force: true })
  }
})
