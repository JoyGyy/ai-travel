/**
 * 用户退出登录 API 测试
 * POST /api/auth/logout
 */
import { describe, expect, it } from 'vitest'

import { POST } from './route'

describe('pOST /api/auth/logout', () => {
  it('成功退出登录并清除 token cookie', async () => {
    const res = await POST()
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.message).toBe('退出登录成功')

    // 验证 Set-Cookie header 清除了 token
    const setCookie = res.headers.get('set-cookie') || ''
    expect(setCookie).toContain('token=')
    expect(setCookie).toMatch(/max-age=0/i)
  })
})
