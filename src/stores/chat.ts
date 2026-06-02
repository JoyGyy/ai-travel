/**
 * 聊天状态管理
 * 使用 Zustand + persist 中间件，刷新页面后消息不丢失
 */
import type { AgentStep, ChatMessage } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  currentAgentStep: number
  addMessage: (msg: ChatMessage) => void
  updateLastMessage: (content: string) => void
  updateLastMessageSteps: (step: AgentStep) => void
  clearMessages: () => void
  setLoading: (loading: boolean) => void
  setCurrentAgentStep: (step: number) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    set => ({
      messages: [],
      isLoading: false,
      currentAgentStep: 0,

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

      updateLastMessageSteps: step =>
        set((state) => {
          const messages = [...state.messages]
          const last = messages[messages.length - 1]
          if (last) {
            const steps = [...(last.steps || [])]
            const idx = steps.findIndex(s => s.step === step.step)
            if (idx >= 0) {
              steps[idx] = step
            } else {
              steps.push(step)
            }
            messages[messages.length - 1] = { ...last, steps }
          }
          return { messages }
        }),

      clearMessages: () => set({ messages: [] }),
      setLoading: isLoading => set({ isLoading }),
      setCurrentAgentStep: currentAgentStep => set({ currentAgentStep }),
    }),
    { name: 'chat_messages' },
  ),
)
