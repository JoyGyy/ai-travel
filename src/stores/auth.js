/**
 * 认证状态管理
 * 使用 Zustand + persist 持久化用户登录状态
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    set => ({
      user: null,
      token: null,
      _hasHydrated: false,
      setHasHydrated: v => set({ _hasHydrated: v }),

      async login(username, password) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        set({ user: data.user, token: data.token })
      },

      async register(username, password) {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        set({ user: data.user, token: data.token })
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
