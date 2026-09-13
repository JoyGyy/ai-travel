import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { proxy } from './proxy'

vi.mock('jose', () => ({
  jwtVerify: vi.fn(),
}))

function createRequest(pathname: string, options: { authorization?: string, token?: string } = {}) {
  const url = new URL(`http://localhost${pathname}`)
  const headers = new Headers()
  const cookies = new Map<string, { value: string }>()

  if (options.authorization)
    headers.set('authorization', options.authorization)
  if (options.token)
    cookies.set('token', { value: options.token })

  return {
    cookies: {
      get: (name: string) => cookies.get(name),
    },
    headers,
    nextUrl: { pathname },
    url: url.toString(),
  } as never
}

describe('proxy 认证守卫', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret-for-proxy'
    vi.clearAllMocks()
  })

  it('受保护页面忽略 Authorization header，仅接受 Cookie token', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({ payload: {}, protectedHeader: { alg: 'HS256' } })
    const redirectSpy = vi.spyOn(NextResponse, 'redirect')

    await proxy(createRequest('/profile', { authorization: 'Bearer valid-token' }))

    expect(jwtVerify).not.toHaveBeenCalled()
    expect(redirectSpy).toHaveBeenCalled()
  })

  it('未登录访问受保护页面重定向到 /login 并携带 from 参数', async () => {
    const redirectSpy = vi.spyOn(NextResponse, 'redirect')

    await proxy(createRequest('/profile'))

    expect(redirectSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        href: expect.stringContaining('/login?from=%2Fprofile'),
      }),
    )
  })

  it('有效 token 访问受保护页面放行', async () => {
    vi.mocked(jwtVerify).mockResolvedValue({ payload: {}, protectedHeader: { alg: 'HS256' } })
    const nextSpy = vi.spyOn(NextResponse, 'next')

    await proxy(createRequest('/profile', { token: 'valid-token' }))

    expect(jwtVerify).toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('普通公开页面直接放行无需 token', async () => {
    const nextSpy = vi.spyOn(NextResponse, 'next')

    await proxy(createRequest('/attractions'))

    expect(jwtVerify).not.toHaveBeenCalled()
    expect(nextSpy).toHaveBeenCalled()
  })

  it('token 无效或过期时清除 cookie 并重定向到登录页', async () => {
    vi.mocked(jwtVerify).mockRejectedValue(new Error('token expired'))
    const redirectSpy = vi.spyOn(NextResponse, 'redirect')

    const res = await proxy(createRequest('/chat', { token: 'expired-token' }))

    expect(redirectSpy).toHaveBeenCalled()
    expect(res.cookies.delete).toBeDefined()
  })
})
