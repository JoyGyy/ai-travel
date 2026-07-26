/**
 * 聊天状态管理 Store
 *
 * 管理 AI 聊天对话的消息列表和加载状态。
 * 不使用持久化，进入聊天页面时自动清空历史消息。
 *
 * 功能：
 * - 添加/更新消息（支持流式响应的逐步更新）
 * - 更新消息的 Agent 步骤信息
 * - 管理加载状态和当前步骤
 */
import type { SSEEvent } from '@/types/api'

import { create } from 'zustand'

// --- 类型定义 ---

/** 单条聊天消息 */
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

// --- 消息 ID 计数器（模块级，用于生成唯一 ID） ---

let messageIdCounter = 0

// --- 创建 Store ---

export const useChatStore = create<ChatState>()(set => ({
  // --- 初始状态 ---

  messages: [],
  isLoading: false,
  currentAgentStep: 0,

  // --- 消息操作 ---

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

  // --- 状态控制 ---

  clearMessages: () => set({ messages: [], isLoading: false, currentAgentStep: 0 }),
  setLoading: isLoading => set({ isLoading }),
  setCurrentAgentStep: currentAgentStep => set({ currentAgentStep }),
}))
