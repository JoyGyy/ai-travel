/**
 * AI 手账会话 API 测试
 * GET /api/travel/chat/sessions
 * POST /api/travel/chat/sessions
 * DELETE /api/travel/chat/sessions
 */
import type * as httpUtils from '@/lib/utils/http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  clearAllChatSessions,
  listChatSessions,
  saveChatSession,
} from '@/lib/services/chatSession'
import { DELETE, GET, POST } from './route'

vi.mock('@/lib/services/chatSession', () => ({
  clearAllChatSessions: vi.fn(),
  listChatSessions: vi.fn(),
  saveChatSession: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => null),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    withAuth:
      (
        handler: (
          req: Request,
          ctx: { user: { id: string, username: string } },
        ) => Promise<Response>,
      ) =>
        async (req: Request) => {
          try {
            return await handler(req, { user: { id: 'u1', username: 'testuser' } })
          }
          catch (err) {
            return actual.errorResponse(err)
          }
        },
    withProtected:
      (
        handler: (
          req: Request,
          ctx: { user: { id: string, username: string } },
        ) => Promise<Response>,
      ) =>
        async (req: Request) => {
          try {
            return await handler(req, { user: { id: 'u1', username: 'testuser' } })
          }
          catch (err) {
            return actual.errorResponse(err)
          }
        },
  }
})

const mockList = vi.mocked(listChatSessions)
const mockSave = vi.mocked(saveChatSession)
const mockClear = vi.mocked(clearAllChatSessions)

describe('gET /api/travel/chat/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功返回当前用户的会话列表', async () => {
    mockList.mockResolvedValueOnce([
      {
        city: '大理',
        createdAt: '2026-08-30T10:00:00Z',
        id: 's1',
        messages: [],
        title: '大理游记',
        updatedAt: '2026-08-30T10:00:00Z',
        userId: 'u1',
      },
    ])

    const res = await GET(new Request('http://localhost/api/travel/chat/sessions'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.sessions).toHaveLength(1)
    expect(json.sessions[0].title).toBe('大理游记')
  })
})

describe('pOST /api/travel/chat/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功保存会话', async () => {
    mockSave.mockResolvedValueOnce({
      city: '成都',
      createdAt: '2026-08-30T10:00:00Z',
      id: 's2',
      messages: [{ id: 'm1', parts: [{ text: '看熊猫', type: 'text' }], role: 'user' }],
      title: '成都游',
      updatedAt: '2026-08-30T10:00:00Z',
      userId: 'u1',
    })

    const req = new Request('http://localhost/api/travel/chat/sessions', {
      body: JSON.stringify({
        city: '成都',
        id: 's2',
        messages: [{ id: 'm1', parts: [{ text: '看熊猫', type: 'text' }], role: 'user' }],
        title: '成都游',
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.session.city).toBe('成都')
  })

  it('请求体缺少 ID 时返回 400', async () => {
    const req = new Request('http://localhost/api/travel/chat/sessions', {
      body: JSON.stringify({ title: '无 ID 会话' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('dELETE /api/travel/chat/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功清空所有会话', async () => {
    mockClear.mockResolvedValueOnce()

    const req = new Request('http://localhost/api/travel/chat/sessions', {
      method: 'DELETE',
    })

    const res = await DELETE(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(mockClear).toHaveBeenCalledWith('u1')
  })
})
