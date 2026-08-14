import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

/**
 * 认证状态管理 Store
 *
 * 使用 Zustand + persist 中间件管理用户认证状态，
 * 自动将登录态持久化到 localStorage（key: travel_auth）。
 *
 * 功能：
 * - 用户登录/注册（调用后端 API）
 * - 登出（清除本地状态）
 * - 水合状态检测（防止 hydration mismatch）
 */
import type { AuthUser } from '@/types/api'

import { loginApi, registerApi } from '@/api/auth'

// --- 类型定义 ---

interface AuthState {
  _hasHydrated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  register: (username: string, password: string) => Promise<void>
  setHasHydrated: (v: boolean) => void
  token: null | string
  user: AuthUser | null
}

// --- 创建 Store ---

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        // --- 初始状态 ---

        _hasHydrated: false,
        async login(username, password) {
          const data = await loginApi(username, password)
          if (data) {
            set({ token: data.token, user: data.user })
          }
        },
        logout() {
          set({ token: null, user: null })
        },
        async register(username, password) {
          const data = await registerApi(username, password)
          if (data) {
            set({ token: data.token, user: data.user })
          }
        },

        // --- 异步操作：登录/注册 ---

        setHasHydrated: (v) => set({ _hasHydrated: v }),

        token: null,

        // --- 同步操作：登出 ---

        user: null,
      }),
      // --- 持久化配置 ---

      {
        name: 'travel_auth',
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true)
        },
      },
    ),
    { name: 'AuthStore' },
  ),
)
