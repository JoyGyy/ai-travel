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

vi.mock('@/lib/ai/recommend', () => ({
  createTravelRecommendStream: vi.fn(() => new Response('recommend-ok', { status: 200 })),
}))

describe('pOST /api/travel/recommend', () => {
  it('校验城市参数', async () => {
    const req = new Request('http://localhost/api/travel/recommend', {
      body: JSON.stringify({ budget: 3000, city: '', days: 3 }),
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('参数正确时返回推荐流', async () => {
    const req = new Request('http://localhost/api/travel/recommend', {
      body: JSON.stringify({ budget: 3000, city: '杭州', days: 3 }),
      method: 'POST',
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('recommend-ok')
  })
})
