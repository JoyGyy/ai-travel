import { beforeEach, describe, expect, it, vi } from 'vitest'

import * as authApi from '@/api/auth'

import { useAuthStore } from '../auth'

vi.mock('@/api/auth')

const mockedLoginApi = vi.mocked(authApi.loginApi)
const mockedRegisterApi = vi.mocked(authApi.registerApi)

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
    const mockData = { success: true as const, user: { id: '1', username: 'test' }, token: 'abc123' }
    mockedLoginApi.mockResolvedValue(mockData)

    await useAuthStore.getState().login('test', '123456')

    const { user, token } = useAuthStore.getState()
    expect(user).toEqual({ id: '1', username: 'test' })
    expect(token).toBe('abc123')
  })

  it('register 成功后设置 user 和 token', async () => {
    const mockData = { success: true as const, user: { id: '2', username: 'new' }, token: 'xyz789' }
    mockedRegisterApi.mockResolvedValue(mockData)

    await useAuthStore.getState().register('new', '123456')

    const { user, token } = useAuthStore.getState()
    expect(user).toEqual({ id: '2', username: 'new' })
    expect(token).toBe('xyz789')
  })

  it('logout 清除 user 和 token', async () => {
    mockedLoginApi.mockResolvedValue({ success: true as const, user: { id: '1', username: 'test' }, token: 'abc' })
    await useAuthStore.getState().login('test', '123')

    useAuthStore.getState().logout()

    const { user, token } = useAuthStore.getState()
    expect(user).toBeNull()
    expect(token).toBeNull()
  })
})
