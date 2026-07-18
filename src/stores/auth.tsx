/**
 * 认证状态管理
 * 使用 Zustand + persist 持久化用户登录状态
 */
import type { AuthUser } from '@/types/api'
import { loginApi, registerApi } from '@/api/auth'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: AuthUser | null
  token: string | null
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setHasHydrated: v => set({ _hasHydrated: v }),

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

      logout() {
        set({ user: null, token: null })
      },
    }),
    {
      name: 'travel_auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    },
  ),
)
