/**
 * 聊天状态管理
 * 使用 Zustand + persist 中间件，刷新页面后消息不丢失
 */
import type { ChatMessage } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  addMessage: (msg: ChatMessage) => void
  updateLastMessage: (content: string) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    set => ({
      messages: [],
      isLoading: false,

      addMessage: msg =>
        set(state => ({ messages: [...state.messages, msg] })),

      updateLastMessage: content =>
        set((state) => {
          const messages = [...state.messages]
          const last = messages[messages.length - 1]
          if (last) {
            messages[messages.length - 1] = { ...last, content }
          }
          return { messages }
        }),

      clearMessages: () => set({ messages: [] }),
      setLoading: isLoading => set({ isLoading }),
    }),
    { name: 'chat_messages' },
  ),
)
