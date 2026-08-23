import { POST } from './route'

vi.mock('@/lib/services/auth', () => ({
  consumeAiQuota: vi.fn(async () => ({ remaining: 1 })),
  getAuthFromHeaders: vi.fn(() => ({ id: 'user-1', username: 'joygy' })),
}))

vi.mock('@/lib/utils/http', async () => {
  const actual = await vi.importActual<typeof import('@/lib/utils/http')>('@/lib/utils/http')
  return {
    ...actual,
    withProtectedRaw: (handler: (req: Request, ctx: { user: { id: string, username: string } }) => Promise<Response>) =>
      async (req: Request) => {
        try {
          return await handler(req, { user: { id: 'user-1', username: 'joygy' } })
        }
        catch (error) {
          return actual.errorResponse(error)
        }
      },
  }
})

vi.mock('@/lib/ai/stream', () => ({
  createTravelChatStream: vi.fn(async () => new Response('ok', { status: 200 })),
}))

describe('pOST /api/travel/chat', () => {
  it('拒绝空消息', async () => {
    const req = new Request('http://localhost/api/travel/chat', {
      body: JSON.stringify({ messages: [] }),
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('有消息时返回流响应', async () => {
    const req = new Request('http://localhost/api/travel/chat', {
      body: JSON.stringify({
        messages: [{ parts: [{ text: '北京三日游', type: 'text' }], role: 'user' }],
      }),
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('ok')
  })
})
