/**
 * 认证状态管理
 * 使用 Zustand + persist 持久化用户登录状态
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'
import { useHistoryStore } from './history'

interface AuthState {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,

      async login(username, password) {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.message)
        set({ user: data.user, token: data.token })
        useHistoryStore.getState().loadUserHistory(data.user.id)
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
        useHistoryStore.getState().loadUserHistory(data.user.id)
      },

      logout() {
        useHistoryStore.getState().saveAndClear()
        set({ user: null, token: null })
      },
    }),
    { name: 'travel_auth' },
  ),
)
