import type { AuthUser } from '@/types/api'

import { loginApi, registerApi } from '@/api/auth'

import { useAuthStore } from './auth'

// --- Mock API 模块 ---

vi.mock('@/api/auth', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
}))

const mockUser: AuthUser = { id: '1', username: 'testuser' }
const mockToken = 'mock-jwt-token'

function readPersistedState(): Record<string, unknown> {
  const stored = localStorage.getItem('travel_auth')
  expect(stored).not.toBeNull()

  return JSON.parse(stored as string).state
}

// --- 测试套件 ---

describe('useAuthStore', () => {
  // 每个测试前重置 store 状态和 localStorage
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().logout()
    useAuthStore.getState().setHasHydrated(false)
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('只保存用户信息，不暴露 token 字段', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state).not.toHaveProperty('token')
    })

    it('_hasHydrated 应该为 false', () => {
      expect(useAuthStore.getState()._hasHydrated).toBe(false)
    })
  })

  describe('login', () => {
    it('成功登录后应该设置 user，但不保存 token', async () => {
      vi.mocked(loginApi).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      })

      await useAuthStore.getState().login('testuser', 'password123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state).not.toHaveProperty('token')
      expect(readPersistedState()).not.toHaveProperty('token')
      expect(loginApi).toHaveBeenCalledWith('testuser', 'password123')
    })

    it('aPI 返回空值时不更新状态', async () => {
      vi.mocked(loginApi).mockResolvedValue(null as never)

      await useAuthStore.getState().login('testuser', 'wrong')

      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('register', () => {
    it('成功注册后应该设置 user，但不保存 token', async () => {
      vi.mocked(registerApi).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      })

      await useAuthStore.getState().register('newuser', 'password123')

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockUser)
      expect(state).not.toHaveProperty('token')
      expect(readPersistedState()).not.toHaveProperty('token')
      expect(registerApi).toHaveBeenCalledWith('newuser', 'password123')
    })
  })

  describe('logout', () => {
    it('应该清空 user', () => {
      useAuthStore.setState({ user: mockUser })

      useAuthStore.getState().logout()

      expect(useAuthStore.getState().user).toBeNull()
    })
  })

  describe('setHasHydrated', () => {
    it('应该更新 _hasHydrated 状态', () => {
      useAuthStore.getState().setHasHydrated(true)
      expect(useAuthStore.getState()._hasHydrated).toBe(true)

      useAuthStore.getState().setHasHydrated(false)
      expect(useAuthStore.getState()._hasHydrated).toBe(false)
    })
  })

  describe('persist 持久化', () => {
    it('localStorage 只持久化 user，不持久化 token', async () => {
      vi.mocked(loginApi).mockResolvedValue({
        success: true,
        token: mockToken,
        user: mockUser,
      })

      await useAuthStore.getState().login('testuser', 'password123')

      const persistedState = readPersistedState()
      expect(persistedState.user).toEqual(mockUser)
      expect(persistedState).not.toHaveProperty('token')
    })

    it('加载旧版 localStorage 时会清理遗留 token', async () => {
      localStorage.setItem(
        'travel_auth',
        JSON.stringify({ state: { token: mockToken, user: mockUser } }),
      )

      await useAuthStore.persist.rehydrate()

      expect(useAuthStore.getState()).not.toHaveProperty('token')
      expect(readPersistedState()).not.toHaveProperty('token')
    })
  })
})
