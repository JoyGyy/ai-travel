/**
 * 健康检查 API 测试
 * GET /api/health
 */
import { GET } from './route'

describe('gET /api/health', () => {
  it('返回状态 ok', async () => {
    const res = await GET()
    const data = await res.json()

    expect(res.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.timestamp).toBeDefined()
    expect(data.version).toBeDefined()
  })
})
