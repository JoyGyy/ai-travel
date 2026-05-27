import { beforeEach, describe, expect, it } from 'vitest'
import { useChatStore } from '../chat'

describe('Chat Store', () => {
  beforeEach(() => {
    useChatStore.setState({ messages: [], isLoading: false })
  })

  it('初始状态应为空消息列表', () => {
    const { messages, isLoading } = useChatStore.getState()
    expect(messages).toEqual([])
    expect(isLoading).toBe(false)
  })

  it('addMessage 应追加消息到列表', () => {
    useChatStore.getState().addMessage({ role: 'user', content: '你好' })
    useChatStore.getState().addMessage({ role: 'assistant', content: '你好！' })
    const { messages } = useChatStore.getState()
    expect(messages.length).toBe(2)
    expect(messages[0].content).toBe('你好')
    expect(messages[1].content).toBe('你好！')
  })

  it('updateLastMessage 应更新最后一条消息', () => {
    useChatStore.getState().addMessage({ role: 'user', content: '问题' })
    useChatStore.getState().addMessage({ role: 'assistant', content: '' })
    useChatStore.getState().updateLastMessage('你好')
    useChatStore.getState().updateLastMessage('你好，世界')
    const { messages } = useChatStore.getState()
    expect(messages[1].content).toBe('你好，世界')
  })

  it('clearMessages 应清空消息列表', () => {
    useChatStore.getState().addMessage({ role: 'user', content: '测试' })
    useChatStore.getState().clearMessages()
    expect(useChatStore.getState().messages).toEqual([])
  })

  it('setLoading 应更新加载状态', () => {
    useChatStore.getState().setLoading(true)
    expect(useChatStore.getState().isLoading).toBe(true)
    useChatStore.getState().setLoading(false)
    expect(useChatStore.getState().isLoading).toBe(false)
  })
})
