/**
 * AI 手账单会话详情与删除 API 测试
 * GET /api/travel/chat/sessions/[id]
 * DELETE /api/travel/chat/sessions/[id]
 */
import type * as httpUtils from '@/lib/utils/http'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteChatSession, getChatSessionById } from '@/lib/services/chatSession'
import { DELETE, GET } from './route'

vi.mock('@/lib/services/chatSession', () => ({
  deleteChatSession: vi.fn(),
  getChatSessionById: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => null),
}))

vi.mock('@/lib/utils/http', async (importOriginal) => {
  const actual: typeof httpUtils = await importOriginal()
  return {
    ...actual,
    withAuth:
      <TContext>(
        handler: (
          req: Request,
          ctx: TContext & { user: { id: string, username: string } },
        ) => Promise<Response>,
      ) =>
        async (req: Request, context?: TContext) => {
          try {
            return await handler(req, { ...context, user: { id: 'u1', username: 'testuser' } } as TContext & { user: { id: string, username: string } })
          }
          catch (err) {
            return actual.errorResponse(err)
          }
        },
    withProtected:
      <TContext>(
        handler: (
          req: Request,
          ctx: TContext & { user: { id: string, username: string } },
        ) => Promise<Response>,
      ) =>
        async (req: Request, context?: TContext) => {
          try {
            return await handler(req, { ...context, user: { id: 'u1', username: 'testuser' } } as TContext & { user: { id: string, username: string } })
          }
          catch (err) {
            return actual.errorResponse(err)
          }
        },
  }
})

const mockGetById = vi.mocked(getChatSessionById)
const mockDelete = vi.mocked(deleteChatSession)

describe('gET /api/travel/chat/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功返回指定会话', async () => {
    mockGetById.mockResolvedValueOnce({
      city: '西安',
      createdAt: '2026-08-30T10:00:00Z',
      id: 's1',
      messages: [],
      title: '西安游记',
      updatedAt: '2026-08-30T10:00:00Z',
      userId: 'u1',
    })

    const res = await GET(new Request('http://localhost/api/travel/chat/sessions/s1'), {
      params: Promise.resolve({ id: 's1' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.session.id).toBe('s1')
  })

  it('会话不存在返回 404', async () => {
    mockGetById.mockResolvedValueOnce(null)

    const res = await GET(new Request('http://localhost/api/travel/chat/sessions/not-found'), {
      params: Promise.resolve({ id: 'not-found' }),
    })

    expect(res.status).toBe(404)
  })
})

describe('dELETE /api/travel/chat/sessions/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功删除指定会话', async () => {
    mockDelete.mockResolvedValueOnce()

    const res = await DELETE(new Request('http://localhost/api/travel/chat/sessions/s1', { method: 'DELETE' }), {
      params: Promise.resolve({ id: 's1' }),
    })

    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(mockDelete).toHaveBeenCalledWith('s1', 'u1')
  })
})
