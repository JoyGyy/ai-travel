import { POST } from './route'

vi.mock('@/lib/services/auth', () => ({
  consumeAiQuota: vi.fn(async () => ({ remaining: 1 })),
  getAuthFromHeaders: vi.fn(() => ({ id: 'user-1', username: 'joygy' })),
}))

vi.mock('@/lib/ai/recommend', () => ({
  createTravelRecommendStream: vi.fn(() => new Response('recommend-ok', { status: 200 })),
}))

describe('POST /api/travel/recommend', () => {
  it('校验城市参数', async () => {
    const req = new Request('http://localhost/api/travel/recommend', {
      method: 'POST',
      body: JSON.stringify({ city: '', budget: 3000, days: 3 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('参数正确时返回推荐流', async () => {
    const req = new Request('http://localhost/api/travel/recommend', {
      method: 'POST',
      body: JSON.stringify({ city: '杭州', budget: 3000, days: 3 }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('recommend-ok')
  })
})
