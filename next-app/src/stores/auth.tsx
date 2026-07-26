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

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { loginApi, registerApi } from '@/api/auth'

// --- 类型定义 ---

interface AuthState {
  user: AuthUser | null
  token: string | null
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

// --- 创建 Store ---

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      // --- 初始状态 ---

      user: null,
      token: null,
      _hasHydrated: false,
      setHasHydrated: v => set({ _hasHydrated: v }),

      // --- 异步操作：登录/注册 ---

      async login(username, password) {
        const data = await loginApi(username, password)
        if (data) {
          set({ user: data.user, token: data.token })
        }
      },

      async register(username, password) {
        const data = await registerApi(username, password)
        if (data) {
          set({ user: data.user, token: data.token })
        }
      },

      // --- 同步操作：登出 ---

      logout() {
        set({ user: null, token: null })
      },
    }),
    // --- 持久化配置 ---

    {
      name: 'travel_auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
