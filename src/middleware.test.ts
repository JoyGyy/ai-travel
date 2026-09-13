import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { middleware } from './middleware'

describe('global auth middleware', () => {
  it('未登录用户访问 /profile 重定向到 /login 并携带 redirect 参数', () => {
    const req = new NextRequest('http://localhost/profile?tab=security')
    const res = middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/login?redirect=%2Fprofile%3Ftab%3Dsecurity')
  })

  it('未登录用户访问 /community/new 重定向到 /login', () => {
    const req = new NextRequest('http://localhost/community/new')
    const res = middleware(req)

    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/login?redirect=%2Fcommunity%2Fnew')
  })

  it('已登录用户携带 token 访问 /profile 放行', () => {
    const req = new NextRequest('http://localhost/profile', {
      headers: {
        cookie: 'token=valid-jwt-token',
      },
    })
    const res = middleware(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('普通公开页面直接放行', () => {
    const req = new NextRequest('http://localhost/attractions')
    const res = middleware(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })
})
