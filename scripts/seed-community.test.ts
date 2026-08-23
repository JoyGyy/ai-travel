import { describe, expect, it } from 'vitest'

import { type SeedPost, seedCommunity } from './seed-community'

const firstWord = (sql: string): string => sql.trim().split(/\s+/)[0]

/** 记录 SQL 的 fake 客户端，users 查询返回预置用户。 */
class FakeClient {
  statements: string[] = []

  async query(text: string, _params?: unknown[]): Promise<{ rows: unknown[] }> {
    this.statements.push(text.trim().replace(/\s+/g, ' '))
    if (text.includes('FROM users'))
      return { rows: [{ id: 'user-joygy', username: 'joygy' }, { id: 'user-test', username: 'test' }] }
    return { rows: [] }
  }
}

const singlePost: SeedPost[] = [{
  authorUsername: 'joygy',
  city: '三亚',
  title: '测试帖',
  content: '内容',
  images: [{ url: '/images/attractions/sanya/sanya-yalong-bay.webp', storageKey: 'seed:x', altText: '图' }],
  itinerarySnapshot: {
    attractionRefs: [],
    budget: 100,
    budgetBreakdown: { accommodation: 50, attractions: 10, food: 20, total: 100, transport: 20 },
    city: '三亚',
    days: 1,
    itinerary: [{ day: 1, title: '海边', spots: [{ name: '亚龙湾', description: '散步', duration: '2小时' }] }],
    tips: ['注意防晒'],
  },
}]

const comments = [{ postIndex: 0, authorUsername: 'test', content: '好帖' }]
const likes = [{ postIndex: 0, username: 'test' }]

describe('seedCommunity', () => {
  it('opens a transaction and commits', async () => {
    const client = new FakeClient()
    const stats = await seedCommunity(client, singlePost, [], [])

    expect(stats).toMatchObject({ posts: 1, images: 1, comments: 0, likes: 0 })
    const statements = client.statements.map(firstWord)
    // 先查询用户，再开启事务，最后提交
    expect(statements.indexOf('BEGIN')).toBeGreaterThanOrEqual(0)
    expect(statements.indexOf('COMMIT')).toBe(statements.length - 1)
    expect(statements.indexOf('BEGIN')).toBeLessThan(statements.indexOf('COMMIT'))
  })

  it('inserts posts, images, comments and likes in order', async () => {
    const client = new FakeClient()
    const stats = await seedCommunity(client, singlePost, comments, likes)

    expect(stats).toMatchObject({ posts: 1, images: 1, comments: 1, likes: 1 })
    const statements = client.statements.map(firstWord)
    expect(statements).toContain('INSERT')
    expect(statements).not.toContain('ROLLBACK')
  })

  it('rolls back when the author is missing', async () => {
    const client = new FakeClient()
    await expect(seedCommunity(client, [{ ...singlePost[0], authorUsername: 'nobody' }]))
      .rejects.toThrow('种子作者不存在')
    expect(client.statements.map(firstWord)).toContain('ROLLBACK')
    expect(client.statements.map(firstWord)).not.toContain('COMMIT')
  })
})
