import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAuthHeader, hasAuthToken, request } from './client'

describe('api 请求客户端认证', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'csrf_token=; max-age=0; path=/'
    vi.restoreAllMocks()
  })

  it('不再从 localStorage 读取 JWT 生成 Authorization 头', () => {
    localStorage.setItem(
      'travel_auth',
      JSON.stringify({ state: { token: 'local-jwt-token', user: { id: '1', username: 'testuser' } } }),
    )

    expect(getAuthHeader()).toEqual({})
    expect(hasAuthToken()).toBe(false)
  })

  it('认证请求只依赖 Cookie，不注入 Authorization 头', async () => {
    localStorage.setItem(
      'travel_auth',
      JSON.stringify({ state: { token: 'local-jwt-token', user: { id: '1', username: 'testuser' } } }),
    )
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
    )

    await request('/api/auth/me', { auth: true })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.credentials).toBe('include')
    expect(init.headers).not.toHaveProperty('Authorization')
  })
})
