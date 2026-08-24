import type { UIMessage } from 'ai'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

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
  activeSessionId: string | null
  sessions: ChatSession[]

  clearAllSessions: () => void
  createSession: (title?: string, city?: string) => string
  deleteSession: (id: string) => void
  getActiveSession: () => ChatSession | null
  renameSession: (id: string, newTitle: string) => void
  saveMessages: (id: string, messages: UIMessage[], detectedCity?: string) => void
  setActiveSessionId: (id: string | null) => void
  setHasHydrated: (val: boolean) => void
}

function deriveTitle(messages: UIMessage[], fallback = '新的手账对话'): string {
  const firstUserMsg = messages.find(m => m.role === 'user')
  if (!firstUserMsg)
    return fallback

  const textPart = firstUserMsg.parts.find(p => p.type === 'text') as { text?: string } | undefined
  const rawText = textPart?.text?.trim()
  if (!rawText)
    return fallback

  // 截取前 20 个字符作为标题
  return rawText.length > 22 ? `${rawText.slice(0, 20)}...` : rawText
}

export const useChatHistoryStore = create<ChatHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        _hasHydrated: false,
        activeSessionId: null,
        clearAllSessions: () => {
          set({ activeSessionId: null, sessions: [] })
        },
        createSession: (title, city) => {
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

          set(state => ({
            activeSessionId: id,
            sessions: [newSession, ...state.sessions],
          }))

          return id
        },
        deleteSession: (id) => {
          set((state) => {
            const nextSessions = state.sessions.filter(s => s.id !== id)
            let nextActiveId = state.activeSessionId
            if (state.activeSessionId === id) {
              nextActiveId = nextSessions.length > 0 ? nextSessions[0].id : null
            }
            return {
              activeSessionId: nextActiveId,
              sessions: nextSessions,
            }
          })
        },
        getActiveSession: () => {
          const { activeSessionId, sessions } = get()
          if (!activeSessionId)
            return null
          return sessions.find(s => s.id === activeSessionId) || null
        },
        renameSession: (id, newTitle) => {
          set(state => ({
            sessions: state.sessions.map((s) => {
              if (s.id === id) {
                return { ...s, title: newTitle.trim() || s.title, updatedAt: Date.now() }
              }
              return s
            }),
          }))
        },
        saveMessages: (id, messages, detectedCity) => {
          if (!id)
            return

          set((state) => {
            const now = Date.now()
            const existing = state.sessions.find(s => s.id === id)

            if (!existing) {
              // 自动创建
              const sessionTitle = deriveTitle(messages)
              const newSession: ChatSession = {
                city: detectedCity,
                createdAt: now,
                id,
                messages,
                title: sessionTitle,
                updatedAt: now,
              }
              return {
                sessions: [newSession, ...state.sessions],
              }
            }

            const shouldUpdateTitle = existing.title === '新的手账对话' || existing.title === '新建对话'
            const nextTitle = shouldUpdateTitle ? deriveTitle(messages, existing.title) : existing.title

            const updatedSessions = state.sessions.map((s) => {
              if (s.id === id) {
                return {
                  ...s,
                  city: detectedCity || s.city,
                  messages,
                  title: nextTitle,
                  updatedAt: now,
                }
              }
              return s
            })

            // 按最后更新时间倒序排列
            updatedSessions.sort((a, b) => b.updatedAt - a.updatedAt)

            return {
              sessions: updatedSessions,
            }
          })
        },
        setActiveSessionId: (id) => {
          set({ activeSessionId: id })
        },
        setHasHydrated: val => set({ _hasHydrated: val }),
        sessions: [],
      }),
      {
        name: 'travel_chat_sessions',
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true)
        },
      },
    ),
    { name: 'ChatHistoryStore' },
  ),
)
