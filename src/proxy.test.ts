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
})
