/**
 * AI 手账会话状态管理 Store
 *
 * 功能：
 * - 多账号隔离：不同用户拥有独立的本地缓存与云端同步通道
 * - 云端持久化：与 PostgreSQL 数据库保持双向同步
 * - 乐观更新与防抖保存：支持高频流式输出下的无卡顿响应
 * - 登出与切换账号自动隔离与重置
 */
import type { UIMessage } from 'ai'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

import {
  clearAllChatSessionsApi,
  deleteChatSessionApi,
  fetchChatSessionsApi,
  saveChatSessionApi,
} from '@/api/chat'

export interface ChatSession {
  city?: string
  createdAt: number
  id: string
  messages: UIMessage[]
  title: string
  updatedAt: number
}

interface ChatHistoryState {
  _hasHydrated: boolean
  _isLoading: boolean
  activeSessionId: string | null
  currentUserId: string | null
  sessions: ChatSession[]

  clearAllSessions: () => void
  createSession: (title?: string, city?: string) => string
  deleteSession: (id: string) => void
  getActiveSession: () => ChatSession | null
  initForUser: (userId: string | null) => Promise<void>
  renameSession: (id: string, newTitle: string) => void
  saveMessages: (id: string, messages: UIMessage[], detectedCity?: string) => void
  setActiveSessionId: (id: string | null) => void
  setHasHydrated: (val: boolean) => void
  syncWithServer: () => Promise<void>
}

// 防抖定时器映射：sessionId -> Timeout
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>()

function getStorageKey(userId: string | null): string {
  return userId ? `travel_chat_sessions_${userId}` : 'travel_chat_sessions_guest'
}

function loadLocalSessions(userId: string | null): ChatSession[] {
  if (typeof window === 'undefined')
    return []
  try {
    const key = getStorageKey(userId)
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    }

    // 针对旧版本旧 key 做平滑数据迁移
    if (userId) {
      const oldRaw = localStorage.getItem('travel_chat_sessions')
      if (oldRaw) {
        try {
          const parsedOld = JSON.parse(oldRaw)
          const sessions = Array.isArray(parsedOld?.state?.sessions) ? parsedOld.state.sessions : []
          if (sessions.length > 0) {
            localStorage.setItem(key, JSON.stringify(sessions))
            localStorage.removeItem('travel_chat_sessions')
            return sessions
          }
        }
        catch {}
      }
    }
    return []
  }
  catch {
    return []
  }
}

function persistLocalSessions(userId: string | null, sessions: ChatSession[]): void {
  if (typeof window === 'undefined')
    return
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(sessions))
  }
  catch {}
}

function deriveTitle(messages: UIMessage[], fallback = '新的手账对话'): string {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg)
    return fallback

  const textPart = firstUserMsg.parts.find(p => p.type === 'text') as { text?: string } | undefined
  const rawText = textPart?.text?.trim()
  if (!rawText)
    return fallback

  return rawText.length > 22 ? `${rawText.slice(0, 20)}...` : rawText
}

function areMessagesEqual(a: UIMessage[], b: UIMessage[]): boolean {
  if (a === b)
    return true
  if (!a || !b || a.length !== b.length)
    return false
  for (let i = 0; i < a.length; i++) {
    const ma = a[i]
    const mb = b[i]
    if (ma.id !== mb.id || ma.role !== mb.role)
      return false
    if (ma.parts?.length !== mb.parts?.length)
      return false
    if (ma.parts && mb.parts) {
      for (let j = 0; j < ma.parts.length; j++) {
        const pa = ma.parts[j] as { text?: string, type: string }
        const pb = mb.parts[j] as { text?: string, type: string }
        if (pa.type !== pb.type || pa.text !== pb.text)
          return false
      }
    }
  }
  return true
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  devtools(
    (set, get) => ({
      _hasHydrated: false,
      _isLoading: false,
      activeSessionId: null,
      clearAllSessions: () => {
        const { currentUserId } = get()
        set({ activeSessionId: null, sessions: [] })
        persistLocalSessions(currentUserId, [])

        if (currentUserId) {
          clearAllChatSessionsApi().catch(() => {})
        }
      },
      createSession: (title, city) => {
        const { currentUserId, sessions } = get()
        const id = nanoid(10)
        const now = Date.now()
        const newSession: ChatSession = {
          city,
          createdAt: now,
          id,
          messages: [],
          title: title || '新的手账对话',
          updatedAt: now,
        }

        const nextSessions = [newSession, ...sessions]
        set({
          activeSessionId: id,
          sessions: nextSessions,
        })
        persistLocalSessions(currentUserId, nextSessions)

        if (currentUserId) {
          saveChatSessionApi({
            city: newSession.city,
            createdAt: newSession.createdAt,
            id: newSession.id,
            messages: newSession.messages,
            title: newSession.title,
            updatedAt: newSession.updatedAt,
          }).catch(() => {})
        }

        return id
      },
      currentUserId: null,
      deleteSession: (id) => {
        const { currentUserId, sessions } = get()
        const nextSessions = sessions.filter(s => s.id !== id)
        let nextActiveId = get().activeSessionId
        if (nextActiveId === id) {
          nextActiveId = nextSessions.length > 0 ? nextSessions[0].id : null
        }

        set({
          activeSessionId: nextActiveId,
          sessions: nextSessions,
        })
        persistLocalSessions(currentUserId, nextSessions)

        if (currentUserId) {
          deleteChatSessionApi(id).catch(() => {})
        }
      },
      getActiveSession: () => {
        const { activeSessionId, sessions } = get()
        if (!activeSessionId)
          return null
        return sessions.find(s => s.id === activeSessionId) || null
      },
      initForUser: async (userId) => {
        const previousUserId = get().currentUserId

        // 清理当前所有待保存的防抖计时器
        saveTimers.forEach(timer => clearTimeout(timer))
        saveTimers.clear()

        if (!userId) {
          // 登出或访客态：清空当前会话数据
          set({
            _hasHydrated: true,
            _isLoading: false,
            activeSessionId: null,
            currentUserId: null,
            sessions: [],
          })
          return
        }

        // 若切换为已存在的同一用户且已水合，仅做静默同步
        const localSessions = loadLocalSessions(userId)
        set({
          _hasHydrated: true,
          _isLoading: true,
          activeSessionId: previousUserId !== userId ? (localSessions[0]?.id || null) : get().activeSessionId,
          currentUserId: userId,
          sessions: localSessions,
        })

        // 异步从云端拉取最新历史手账
        try {
          await get().syncWithServer()
        }
        catch {
          // 弱网或离线时保留本地缓存
        }
        finally {
          set({ _isLoading: false })
        }
      },
      renameSession: (id, newTitle) => {
        const { currentUserId, sessions } = get()
        const trimmed = newTitle.trim()
        const target = sessions.find(s => s.id === id)
        if (!target)
          return

        const nextSessions = sessions.map((s) => {
          if (s.id === id) {
            return { ...s, title: trimmed || s.title, updatedAt: Date.now() }
          }
          return s
        })

        set({ sessions: nextSessions })
        persistLocalSessions(currentUserId, nextSessions)

        const updated = nextSessions.find(s => s.id === id)
        if (currentUserId && updated) {
          saveChatSessionApi({
            city: updated.city,
            createdAt: updated.createdAt,
            id: updated.id,
            messages: updated.messages,
            title: updated.title,
            updatedAt: updated.updatedAt,
          }).catch(() => {})
        }
      },
      saveMessages: (id, messages, detectedCity) => {
        if (!id)
          return

        const { currentUserId, sessions } = get()
        const existing = sessions.find(s => s.id === id)

        let nextSessions: ChatSession[]
        let targetSession: ChatSession

        if (!existing) {
          const now = Date.now()
          const sessionTitle = deriveTitle(messages)
          targetSession = {
            city: detectedCity,
            createdAt: now,
            id,
            messages,
            title: sessionTitle,
            updatedAt: now,
          }
          nextSessions = [targetSession, ...sessions]
        }
        else {
          const isSameMessages = areMessagesEqual(existing.messages, messages)
          if (isSameMessages && (!detectedCity || existing.city === detectedCity)) {
            return
          }

          const now = Date.now()
          const shouldUpdateTitle = existing.title === '新的手账对话' || existing.title === '新建对话'
          const nextTitle = shouldUpdateTitle ? deriveTitle(messages, existing.title) : existing.title

          targetSession = {
            ...existing,
            city: detectedCity || existing.city,
            messages,
            title: nextTitle,
            updatedAt: now,
          }

          nextSessions = sessions.map(s => (s.id === id ? targetSession : s))
        }

        set({ sessions: nextSessions })
        persistLocalSessions(currentUserId, nextSessions)

        // 防抖同步至云端数据库（500ms）
        if (currentUserId) {
          const existingTimer = saveTimers.get(id)
          if (existingTimer) {
            clearTimeout(existingTimer)
          }

          const timer = setTimeout(() => {
            saveTimers.delete(id)
            saveChatSessionApi({
              city: targetSession.city,
              createdAt: targetSession.createdAt,
              id: targetSession.id,
              messages: targetSession.messages,
              title: targetSession.title,
              updatedAt: targetSession.updatedAt,
            }).catch(() => {})
          }, 500)

          saveTimers.set(id, timer)
        }
      },
      setActiveSessionId: (id) => {
        set({ activeSessionId: id })
      },
      setHasHydrated: val => set({ _hasHydrated: val }),
      sessions: [],
      syncWithServer: async () => {
        const { currentUserId } = get()
        if (!currentUserId)
          return

        const res = await fetchChatSessionsApi()
        if (res?.sessions) {
          const mapped: ChatSession[] = res.sessions.map(s => ({
            city: s.city || undefined,
            createdAt: new Date(s.createdAt).getTime(),
            id: s.id,
            messages: Array.isArray(s.messages) ? s.messages : [],
            title: s.title,
            updatedAt: new Date(s.updatedAt).getTime(),
          }))

          set((state) => {
            // 保留当前激活的 activeSessionId，若不在列表中则默认选中第一个
            let nextActiveId = state.activeSessionId
            if (mapped.length > 0 && (!nextActiveId || !mapped.some(s => s.id === nextActiveId))) {
              nextActiveId = mapped[0].id
            }
            else if (mapped.length === 0) {
              nextActiveId = null
            }
            return {
              activeSessionId: nextActiveId,
              sessions: mapped,
            }
          })

          persistLocalSessions(currentUserId, mapped)
        }
      },
    }),
    { name: 'ChatHistoryStore' },
  ),
)
