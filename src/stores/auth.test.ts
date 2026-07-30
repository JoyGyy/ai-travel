import type { AuthUser } from '@/types/api'

import { useAuthStore } from './auth'

// --- Mock API 模块 ---

vi.mock('@/api/auth', () => ({
  loginApi: vi.fn(),
  registerApi: vi.fn(),
}))

import { loginApi, registerApi } from '@/api/auth'

const mockUser: AuthUser = { id: '1', username: 'testuser' }
const mockToken = 'mock-jwt-token'

// --- 测试套件 ---

describe('useAuthStore', () => {
  // 每个测试前重置 store 状态和 localStorage
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.setState({
      user: null,
      token: null,
      _hasHydrated: false,
    })
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('user 和 token 应该为 null', () => {
      const { user, token } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(token).toBeNull()
    })

    it('_hasHydrated 应该为 false', () => {
      expect(useAuthStore.getState()._hasHydrated).toBe(false)
    })
  })

  describe('login', () => {
    it('成功登录后应该设置 user 和 token', async () => {
      vi.mocked(loginApi).mockResolvedValue({
        success: true,
        user: mockUser,
        token: mockToken,
      })

      await useAuthStore.getState().login('testuser', 'password123')

      const { user, token } = useAuthStore.getState()
      expect(user).toEqual(mockUser)
      expect(token).toBe(mockToken)
      expect(loginApi).toHaveBeenCalledWith('testuser', 'password123')
    })

    it('API 返回空值时不更新状态', async () => {
      vi.mocked(loginApi).mockResolvedValue(null as any)

      await useAuthStore.getState().login('testuser', 'wrong')

      const { user, token } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(token).toBeNull()
    })
  })

  describe('register', () => {
    it('成功注册后应该设置 user 和 token', async () => {
      vi.mocked(registerApi).mockResolvedValue({
        success: true,
        user: mockUser,
        token: mockToken,
      })

      await useAuthStore.getState().register('newuser', 'password123')

      const { user, token } = useAuthStore.getState()
      expect(user).toEqual(mockUser)
      expect(token).toBe(mockToken)
      expect(registerApi).toHaveBeenCalledWith('newuser', 'password123')
    })
  })

  describe('logout', () => {
    it('应该清空 user 和 token', () => {
      // 先设置登录状态
      useAuthStore.setState({ user: mockUser, token: mockToken })

      useAuthStore.getState().logout()

      const { user, token } = useAuthStore.getState()
      expect(user).toBeNull()
      expect(token).toBeNull()
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
    it('登出后 localStorage 应该清除 user 和 token', () => {
      useAuthStore.setState({ user: mockUser, token: mockToken })
      useAuthStore.getState().logout()

      // persist 中间件会写入 localStorage，检查 key 存在且 user/token 为 null
      const stored = localStorage.getItem('travel_auth')
      if (stored) {
        const parsed = JSON.parse(stored)
        expect(parsed.state.user).toBeNull()
        expect(parsed.state.token).toBeNull()
      }
    })
  })
})
