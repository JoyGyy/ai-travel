/**
 * 聊天状态管理
 * 进入页面时自动清空，不持久化
 */
import type { SSEEvent } from '@/types/api'
import { create } from 'zustand'

interface ChatMessage {
  _id: number
  role: 'user' | 'assistant'
  content: string
  steps?: Extract<SSEEvent, { type: 'step' }>[]
}

interface ChatState {
  messages: ChatMessage[]
  isLoading: boolean
  currentAgentStep: number
  addMessage: (msg: Omit<ChatMessage, '_id'>) => void
  updateLastMessage: (content: string) => void
  updateLastMessageSteps: (step: Extract<SSEEvent, { type: 'step' }>) => void
  clearMessages: () => void
  setLoading: (isLoading: boolean) => void
  setCurrentAgentStep: (currentAgentStep: number) => void
}

let messageIdCounter = 0

export const useChatStore = create<ChatState>()(set => ({
  messages: [],
  isLoading: false,
  currentAgentStep: 0,

  addMessage: msg =>
    set(state => ({ messages: [...state.messages, { ...msg, _id: ++messageIdCounter }] })),

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
        }
        else {
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
