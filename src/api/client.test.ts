import { beforeEach, describe, expect, it, vi } from 'vitest'

import { del, get, getAuthHeader, hasAuthToken, post, put, request } from './client'

function mockJsonFetch(data: unknown = { success: true }) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    }),
  )
}

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
    const fetchMock = mockJsonFetch()

    await request('/api/auth/me', { auth: true })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.credentials).toBe('include')
    expect(init.headers).not.toHaveProperty('Authorization')
  })
})

describe('api 请求方法封装', () => {
  beforeEach(() => {
    document.cookie = 'csrf_token=; max-age=0; path=/'
    vi.restoreAllMocks()
  })

  it('get 使用 GET 请求并转发配置', async () => {
    const fetchMock = mockJsonFetch({ success: true })
    const signal = new AbortController().signal

    const result = await get<{ success: true }>('/api/auth/me', { auth: true, signal })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(result).toEqual({ success: true })
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/me')
    expect(init.method).toBe('GET')
    expect(init.credentials).toBe('include')
    expect(init.signal).toBe(signal)
  })

  it('post 发送 JSON body 并附加 CSRF token', async () => {
    document.cookie = 'csrf_token=valid-csrf; path=/'
    const fetchMock = mockJsonFetch({ id: '1' })
    const body = { title: '旅行计划' }

    const result = await post<{ id: string }>('/api/community/posts', body, {
      headers: { 'X-Test': 'yes' },
    })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(result).toEqual({ id: '1' })
    expect(init.method).toBe('POST')
    expect(init.body).toBe(JSON.stringify(body))
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['X-CSRF-Token']).toBe('valid-csrf')
    expect(headers['X-Test']).toBe('yes')
  })

  it('put 使用 PUT 请求并发送 JSON body', async () => {
    document.cookie = 'csrf_token=valid-csrf; path=/'
    const fetchMock = mockJsonFetch({ success: true })
    const body = { currentPassword: 'Oldpass1', newPassword: 'Newpass1' }

    await put('/api/auth/password', body, { auth: true })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(init.method).toBe('PUT')
    expect(init.body).toBe(JSON.stringify(body))
  })

  it('del 使用 DELETE 请求且不发送 body', async () => {
    document.cookie = 'csrf_token=valid-csrf; path=/'
    const fetchMock = mockJsonFetch({ success: true })

    await del('/api/community/posts/1', { auth: true })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    const headers = init.headers as Record<string, string>
    expect(init.method).toBe('DELETE')
    expect(init.body).toBeUndefined()
    expect(headers['X-CSRF-Token']).toBe('valid-csrf')
  })
})
