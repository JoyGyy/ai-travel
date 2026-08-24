import { beforeEach, describe, expect, it } from 'vitest'
import { useChatHistoryStore } from './chatHistory'

describe('chatHistoryStore', () => {
  beforeEach(() => {
    useChatHistoryStore.getState().clearAllSessions()
  })

  it('应该能创建并切换会话', () => {
    const store = useChatHistoryStore.getState()
    const id = store.createSession('大理自驾游', '大理')

    expect(id).toBeDefined()
    expect(useChatHistoryStore.getState().sessions).toHaveLength(1)
    expect(useChatHistoryStore.getState().activeSessionId).toBe(id)
    expect(useChatHistoryStore.getState().getActiveSession()?.title).toBe('大理自驾游')
  })

  it('保存消息时应该自动推导标题', () => {
    const store = useChatHistoryStore.getState()
    const id = store.createSession()

    store.saveMessages(id, [
      {
        id: 'msg-1',
        parts: [{ text: '成都看大熊猫吃竹子与奎星楼街火锅', type: 'text' }],
        role: 'user',
      },
      {
        id: 'msg-2',
        parts: [{ text: '好的，为您规划成都一日游行程...', type: 'text' }],
        role: 'assistant',
      },
    ], '成都')

    const session = useChatHistoryStore.getState().sessions.find(s => s.id === id)
    expect(session?.title).toContain('成都看大熊猫')
    expect(session?.city).toBe('成都')
    expect(session?.messages).toHaveLength(2)
  })

  it('删除和重命名会话', () => {
    const store = useChatHistoryStore.getState()
    const id1 = store.createSession('会话1')
    const id2 = store.createSession('会话2')

    store.renameSession(id1, '修改后的会话1')
    expect(useChatHistoryStore.getState().sessions.find(s => s.id === id1)?.title).toBe('修改后的会话1')

    store.deleteSession(id2)
    expect(useChatHistoryStore.getState().sessions).toHaveLength(1)
    expect(useChatHistoryStore.getState().activeSessionId).toBe(id1)
  })
})
