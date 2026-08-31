/**
 * AI 手账会话领域服务单元测试
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearAllChatSessions,
  deleteChatSession,
  getChatSessionById,
  listChatSessions,
  saveChatSession,
} from './chatSession'

const mockQuery = vi.fn()

vi.mock('../db', () => ({
  query: (...args: unknown[]) => mockQuery(...args),
  typedQuery: <T>(result: unknown[]) => result as unknown as T[],
}))

describe('chatSession 服务', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listChatSessions', () => {
    it('未登录抛出 401 错误', async () => {
      await expect(listChatSessions('')).rejects.toThrow('未登录')
    })

    it('成功查询当前用户的会话列表', async () => {
      const mockRows = [
        {
          city: '大理',
          created_at: new Date('2026-08-30T10:00:00Z'),
          id: 'sess-1',
          messages: [{ id: 'm1', parts: [{ text: '去大理', type: 'text' }], role: 'user' }],
          title: '大理自驾手账',
          updated_at: new Date('2026-08-30T12:00:00Z'),
          user_id: 'user-1',
        },
      ]
      mockQuery.mockResolvedValueOnce({ rows: mockRows })

      const result = await listChatSessions('user-1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('sess-1')
      expect(result[0].title).toBe('大理自驾手账')
      expect(result[0].city).toBe('大理')
      expect(result[0].messages).toHaveLength(1)
    })
  })

  describe('getChatSessionById', () => {
    it('未登录或参数缺失时抛出错误', async () => {
      await expect(getChatSessionById('sess-1', '')).rejects.toThrow('未登录')
      await expect(getChatSessionById('', 'user-1')).rejects.toThrow('会话 ID 不能为空')
    })

    it('会话不存在返回 null', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })
      const result = await getChatSessionById('sess-non-existent', 'user-1')
      expect(result).toBeNull()
    })

    it('成功返回当前用户的会话', async () => {
      const mockRow = {
        city: '成都',
        created_at: new Date('2026-08-31T08:00:00Z'),
        id: 'sess-2',
        messages: [{ id: 'm2', parts: [{ text: '看熊猫', type: 'text' }], role: 'user' }],
        title: '成都大熊猫',
        updated_at: new Date('2026-08-31T09:00:00Z'),
        user_id: 'user-1',
      }
      mockQuery.mockResolvedValueOnce({ rows: [mockRow] })

      const result = await getChatSessionById('sess-2', 'user-1')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('sess-2')
      expect(result?.city).toBe('成都')
    })
  })

  describe('saveChatSession', () => {
    it('未登录或参数缺失时抛出错误', async () => {
      await expect(saveChatSession('', { id: 'sess-1', messages: [] })).rejects.toThrow('未登录')
      await expect(saveChatSession('user-1', { id: '', messages: [] })).rejects.toThrow('会话 ID 不能为空')
    })

    it('尝试修改其他用户的会话时抛出 403', async () => {
      // 模拟已存在属于 user-other 的会话
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'user-other' }] })

      await expect(
        saveChatSession('user-1', { id: 'sess-other', messages: [], title: '试图篡改' }),
      ).rejects.toThrow('无权修改其他用户的会话')
    })

    it('成功插入或更新会话', async () => {
      // 检查属于自己或不存在
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] })
      // INSERT RETURNING
      const mockRow = {
        city: '西安',
        created_at: new Date('2026-08-31T10:00:00Z'),
        id: 'sess-3',
        messages: [{ id: 'm3', parts: [{ text: '兵马俑', type: 'text' }], role: 'user' }],
        title: '西安盛唐游',
        updated_at: new Date('2026-08-31T10:05:00Z'),
        user_id: 'user-1',
      }
      mockQuery.mockResolvedValueOnce({ rows: [mockRow] })

      const result = await saveChatSession('user-1', {
        city: '西安',
        id: 'sess-3',
        messages: [{ id: 'm3', parts: [{ text: '兵马俑', type: 'text' }], role: 'user' }],
        title: '西安盛唐游',
      })

      expect(result.id).toBe('sess-3')
      expect(result.title).toBe('西安盛唐游')
      expect(result.city).toBe('西安')
    })
  })

  describe('deleteChatSession', () => {
    it('无权删除其他用户的会话抛出 403', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'user-other' }] })

      await expect(deleteChatSession('sess-other', 'user-1')).rejects.toThrow('无权删除其他用户的会话')
    })

    it('成功软删除自己的会话', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ user_id: 'user-1' }] })
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      await expect(deleteChatSession('sess-1', 'user-1')).resolves.toBeUndefined()
    })
  })

  describe('clearAllChatSessions', () => {
    it('成功软删除当前用户所有会话', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 5 })

      await expect(clearAllChatSessions('user-1')).resolves.toBeUndefined()
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE chat_sessions SET deleted_at = NOW()'),
        ['user-1'],
      )
    })
  })
})
