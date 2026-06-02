/**
 * 聊天状态管理
 * 进入页面时自动清空，不持久化
 */
import type { AgentStep, ChatMessage } from '@/types'
import { create } from 'zustand'

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

export const useChatStore = create<ChatState>()(set => ({
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

  clearMessages: () => set({ messages: [], isLoading: false, currentAgentStep: 0 }),
  setLoading: isLoading => set({ isLoading }),
  setCurrentAgentStep: currentAgentStep => set({ currentAgentStep }),
}))
