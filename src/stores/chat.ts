/**
 * 聊天状态管理
 * 使用 Zustand 管理 AI 对话的全局状态
 */
import type { ChatMessage } from '@/types'
import { create } from 'zustand'

/** 聊天状态接口定义 */
interface ChatState {
  messages: ChatMessage[]     // 消息列表
  isLoading: boolean          // 是否正在等待 AI 响应
  addMessage: (msg: ChatMessage) => void      // 添加新消息
  updateLastMessage: (content: string) => void // 更新最后一条消息的内容（用于流式输出）
  clearMessages: () => void   // 清空所有消息
  setLoading: (loading: boolean) => void       // 设置加载状态
}

/**
 * 创建聊天状态 store
 * Zustand 的 create 函数接收一个 set 函数用于更新状态
 */
export const useChatStore = create<ChatState>(set => ({
  messages: [], // 初始消息列表为空
  isLoading: false, // 初始未加载

  // 添加消息：将新消息追加到消息列表末尾
  addMessage: msg =>
    set(state => ({ messages: [...state.messages, msg] })),

  // 更新最后一条消息：用于 SSE 流式输出时逐步更新 AI 回复内容
  updateLastMessage: content =>
    set((state) => {
      const messages = [...state.messages] // 创建新数组以触发 React 更新
      const last = messages[messages.length - 1]
      if (last) {
        // 更新最后一条消息的内容，保持其他属性不变
        messages[messages.length - 1] = { ...last, content }
      }
      return { messages }
    }),

  // 清空消息：重置消息列表
  clearMessages: () => set({ messages: [] }),

  // 设置加载状态
  setLoading: isLoading => set({ isLoading }),
}))
