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

  it('点击查看与切换会话时，不应改变历史列表中的排列位置', () => {
    const store = useChatHistoryStore.getState()
    const id1 = store.createSession('会话1')
    const id2 = store.createSession('会话2')
    const id3 = store.createSession('会话3')

    const initialOrder = useChatHistoryStore.getState().sessions.map(s => s.id)
    expect(initialOrder).toEqual([id3, id2, id1])

    // 点击切换到最下方的会话1
    store.setActiveSessionId(id1)
    const targetSession = useChatHistoryStore.getState().sessions.find(s => s.id === id1)
    store.saveMessages(id1, targetSession?.messages || [], targetSession?.city)

    // 验证顺序保持严格一致，绝不乱跳
    const afterOrder = useChatHistoryStore.getState().sessions.map(s => s.id)
    expect(afterOrder).toEqual([id3, id2, id1])
  })

  it('流式生成过程中文本内容增长时，应能正确更新会话持久化消息', () => {
    const store = useChatHistoryStore.getState()
    const id = store.createSession('流式测试')

    // 初始短消息
    store.saveMessages(id, [
      { id: 'user-1', parts: [{ text: '去西安', type: 'text' }], role: 'user' },
      { id: 'ai-1', parts: [{ text: '正在', type: 'text' }], role: 'assistant' },
    ], '西安')

    const session1 = useChatHistoryStore.getState().sessions.find(s => s.id === id)
    expect((session1?.messages[1].parts[0] as { text: string }).text).toBe('正在')

    // 流式增长为完整消息
    store.saveMessages(id, [
      { id: 'user-1', parts: [{ text: '去西安', type: 'text' }], role: 'user' },
      { id: 'ai-1', parts: [{ text: '正在为您规划完整的西安4日盛唐路线：兵马俑 ➔ 华清宫 ➔ 大雁塔', type: 'text' }], role: 'assistant' },
    ], '西安')

    const session2 = useChatHistoryStore.getState().sessions.find(s => s.id === id)
    expect((session2?.messages[1].parts[0] as { text: string }).text).toContain('兵马俑 ➔ 华清宫')
  })
})
