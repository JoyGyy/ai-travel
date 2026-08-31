/**
 * 认证状态管理 Store
 *
 * 使用 Zustand + persist 中间件管理用户认证状态，
 * 仅将非敏感用户信息持久化到 localStorage（key: travel_auth）。
 *
 * 功能：
 * - 用户登录/注册（调用后端 API）
 * - 检查当前会话有效性（与服务端 Cookie 对齐）
 * - 退出登录（调用后端 API 清除 httpOnly Cookie 并重置本地状态）
 * - 水合状态检测（防止 hydration mismatch）
 * - 联动手账 Store（按账号初始化与隔离历史记录）
 */
import type { AuthUser } from '@/types/api'
import { create } from 'zustand'

import { devtools, persist } from 'zustand/middleware'

import { getMeApi, loginApi, logoutApi, registerApi } from '@/api/auth'
import { useChatHistoryStore } from './chatHistory'

// --- 类型定义 ---

interface AuthState {
  _hasHydrated: boolean
  checkAuth: () => Promise<void>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (username: string, password: string) => Promise<void>
  setHasHydrated: (v: boolean) => void
  user: AuthUser | null
}

// --- 创建 Store ---

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      set => ({
        // --- 初始状态 ---
        _hasHydrated: false,

        /** 静默校验并与服务端 Session 同步 */
        async checkAuth() {
          try {
            const data = await getMeApi()
            if (data?.user) {
              set({ user: data.user })
              useChatHistoryStore.getState().initForUser(data.user.id).catch(() => {})
            }
            else {
              set({ user: null })
              useChatHistoryStore.getState().initForUser(null).catch(() => {})
            }
          }
          catch {
            // 服务端 Cookie 无效或过期，清空前端 user，避免 UI 假登录
            set({ user: null })
            useChatHistoryStore.getState().initForUser(null).catch(() => {})
          }
        },

        async login(username, password) {
          const data = await loginApi(username, password)
          if (data) {
            set({ user: data.user })
            useChatHistoryStore.getState().initForUser(data.user.id).catch(() => {})
          }
        },

        /** 退出登录：同时通知后端清除 Cookie 与重置本地状态 */
        async logout() {
          try {
            await logoutApi()
          }
          catch {
            // 忽略网络错误，确保本地状态清空
          }
          finally {
            set({ user: null })
            useChatHistoryStore.getState().initForUser(null).catch(() => {})
          }
        },

        async register(username, password) {
          const data = await registerApi(username, password)
          if (data) {
            set({ user: data.user })
            useChatHistoryStore.getState().initForUser(data.user.id).catch(() => {})
          }
        },

        setHasHydrated: v => set({ _hasHydrated: v }),

        user: null,
      }),
      // --- 持久化配置 ---
      {
        merge: (persistedState, currentState) => {
          const state = persistedState as Partial<AuthState> | undefined
          return { ...currentState, user: state?.user ?? null }
        },
        name: 'travel_auth',
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true)
          if (state?.user?.id) {
            useChatHistoryStore.getState().initForUser(state.user.id).catch(() => {})
          }
          else {
            useChatHistoryStore.getState().initForUser(null).catch(() => {})
          }
          // 水合完成后自动向服务端验证 Cookie 是否仍然有效
          if (state?.user) {
            state.checkAuth()
          }
        },
        partialize: state => ({ user: state.user }),
      },
    ),
    { name: 'AuthStore' },
  ),
)
