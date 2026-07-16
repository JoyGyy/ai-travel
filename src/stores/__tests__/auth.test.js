import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAuthStore } from '../auth'

vi.mock('@/api/auth', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
}))

import { loginApi, registerApi } from '@/api/auth'

describe('auth store', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({ user: null, token: null })
  })

  it('初始状态未登录', () => {
    const { user, token } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
  })

  it('login 成功后设置 user 和 token', async () => {
    const mockData = { user: { username: 'test' }, token: 'abc123' }
    loginApi.mockResolvedValue(mockData)

    await useAuthStore.getState().login('test', '123456')

    const { user, token } = useAuthStore.getState()
    expect(user).toEqual({ username: 'test' })
    expect(token).toBe('abc123')
  })

  it('register 成功后设置 user 和 token', async () => {
    const mockData = { user: { username: 'new' }, token: 'xyz789' }
    registerApi.mockResolvedValue(mockData)

    await useAuthStore.getState().register('new', '123456')

    const { user, token } = useAuthStore.getState()
    expect(user).toEqual({ username: 'new' })
    expect(token).toBe('xyz789')
  })

  it('logout 清除 user 和 token', async () => {
    loginApi.mockResolvedValue({ user: { username: 'test' }, token: 'abc' })
    await useAuthStore.getState().login('test', '123')

    useAuthStore.getState().logout()

    const { user, token } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
  })
})
