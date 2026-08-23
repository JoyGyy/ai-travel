import { describe, expect, it } from 'vitest'

import attractions from '../src/knowledge/attractions-product.json'
import {
  type AttractionRow,
  type QueryClient,
  mapAttractionToRow,
  seedAttractions,
} from './seed-attractions'

const firstWord = (sql: string): string => sql.trim().split(/\s+/)[0]

/** 记录完整 SQL 的 fake 查询客户端，标签 INSERT 返回自增 id。 */
class FakeClient implements QueryClient {
  statements: string[] = []
  tagIdCounter = 1
  shouldThrow = false

  async query(text: string, _params?: unknown[]): Promise<{ rows: { id: number }[] }> {
    const normalized = text.trim().replace(/\s+/g, ' ')
    this.statements.push(normalized)
    if (this.shouldThrow && this.statements.length >= 3) {
      throw new Error('boom')
    }
    if (normalized.startsWith('INSERT INTO tags')) {
      return { rows: [{ id: this.tagIdCounter++ }] }
    }
    return { rows: [] }
  }
}

const realRows = attractions.map(mapAttractionToRow)

describe('mapAttractionToRow', () => {
  it('maps the full 60-entry catalog', () => {
    expect(realRows).toHaveLength(60)
    expect(new Set(realRows.map(row => row.city)).size).toBe(10)
  })

  it('maps camelCase fields to snake_case columns', () => {
    const entry = {
      id: 'beijing-badaling-great-wall',
      name: '八达岭长城',
      city: '北京',
      ticketType: 'paid',
      priceText: '参考价 ¥35-40',
      coverImage: '/images/attractions/beijing/beijing-badaling-great-wall.webp',
      summary: '摘要',
      description: '描述',
      address: '地址',
      openingHours: '9:00-17:00',
      recommendedDuration: '2-3小时',
      aliases: ['长城'],
      highlights: ['历史'],
      tips: ['注意'],
      suitableFor: ['亲友'],
      bookingLinks: { ctrip: 'x' },
      tags: ['历史', '必去'],
    }
    const row = mapAttractionToRow(entry)
    expect(row).toMatchObject({
      id: 'beijing-badaling-great-wall',
      ticket_type: 'paid',
      price_text: '参考价 ¥35-40',
      cover_image: '/images/attractions/beijing/beijing-badaling-great-wall.webp',
      opening_hours: '9:00-17:00',
      recommended_duration: '2-3小时',
      suitable_for: ['亲友'],
      booking_links: { ctrip: 'x' },
      tags: ['历史', '必去'],
    })
  })

  it('provides safe defaults for missing fields', () => {
    const row = mapAttractionToRow({ id: 'x', name: 'X', city: '北京', coverImage: '/a.webp' })
    expect(row.ticket_type).toBe('free')
    expect(row.price_text).toBe('')
    expect(row.booking_links).toEqual({})
    expect(row.tags).toEqual([])
    expect(row.aliases).toEqual([])
  })
})

describe('seedAttractions', () => {
  it('opens a transaction, upserts rows and commits in order', async () => {
    const client = new FakeClient()
    const count = await seedAttractions(client, realRows)

    expect(count).toBe(60)
    expect(firstWord(client.statements[0])).toBe('BEGIN')
    expect(firstWord(client.statements[client.statements.length - 1])).toBe('COMMIT')
    expect(client.statements.map(firstWord)).not.toContain('ROLLBACK')
    // 每个景点 1 次景点 UPSERT + 1 次删除旧标签关系
    expect(client.statements.filter(s => firstWord(s) === 'INSERT' && s.includes('attractions'))).toHaveLength(60)
    expect(client.statements.filter(s => firstWord(s) === 'DELETE')).toHaveLength(60)
  })

  it('does not overwrite id or created_at in the UPSERT conflict clause', async () => {
    const client = new FakeClient()
    const single = [realRows[0]]
    await seedAttractions(client, single)

    const upsert = client.statements.find(s => firstWord(s) === 'INSERT' && s.includes('attractions'))
    expect(upsert).toBeDefined()
    const conflict = (upsert as string).split('ON CONFLICT')[1]
    // 冲突更新子句不得更新 id 或 created_at
    expect(conflict).not.toMatch(/id\s*=/)
    expect(conflict).not.toMatch(/created_at/)
  })

  it('inserts one tag relation per unique tag', async () => {
    const client = new FakeClient()
    const row: AttractionRow = {
      id: 't1',
      name: '测试',
      city: '北京',
      ticket_type: 'free',
      price_text: '',
      cover_image: '/a.webp',
      summary: '',
      description: '',
      address: '',
      opening_hours: '',
      recommended_duration: '',
      aliases: [],
      highlights: [],
      tips: [],
      suitable_for: [],
      booking_links: {},
      tags: ['历史', '自然'],
    }
    await seedAttractions(client, [row])

    const tagInserts = client.statements.filter(s => s.startsWith('INSERT INTO tags ('))
    expect(tagInserts).toHaveLength(2)
    // tag id 递增使用
    expect(client.tagIdCounter).toBeGreaterThanOrEqual(3)
  })

  it('rolls back on error', async () => {
    const client = new FakeClient()
    client.shouldThrow = true
    await expect(seedAttractions(client, realRows)).rejects.toThrow('boom')
    expect(client.statements.map(firstWord)).toContain('ROLLBACK')
    expect(client.statements.map(firstWord)).not.toContain('COMMIT')
  })
})
