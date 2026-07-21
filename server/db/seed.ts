/**
 * 数据迁移脚本
 * 从 JSON 文件导入景点数据到 PostgreSQL
 * 用法: npx tsx db/seed.ts
 */

/* eslint-disable no-console -- CLI 迁移脚本需要输出进度信息 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { config } from 'dotenv'
import pg from 'pg'

// 加载 .env 配置
config({ path: path.resolve(import.meta.dirname!, '../../.env') })

const { Pool } = pg
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('错误: 请在 .env 中配置 DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

// 数据文件路径
const SCHEMA_PATH = path.join(import.meta.dirname!, 'schema.sql')
const PRODUCT_PATH = path.join(import.meta.dirname!, '../knowledge/attractions-product.json')
const KNOWLEDGE_PATH = path.join(import.meta.dirname!, '../knowledge/attractions.json')

interface AttractionProduct {
  id: string
  name: string
  city: string
  ticketType: string
  priceText: string
  coverImage: string
  summary: string
  description: string
  address: string
  openingHours: string
  recommendedDuration: string
  tags: string[]
  aliases: string[]
  highlights: string[]
  tips: string[]
  suitableFor: string[]
  bookingLinks: Record<string, unknown>
}

interface KnowledgeCity {
  city: string
  food: string[]
  transport: string
  bestSeason: string
  accommodation: unknown[]
  nightlife: unknown[]
  attractions: Array<{
    name: string
    description: string
    ticket: number
    duration: string
    tips?: string
    indoor?: boolean
    tags?: string[]
  }>
}

// ========== 迁移步骤 ==========

/** 执行建表 SQL */
async function runSchema(client: pg.PoolClient) {
  const sql = await readFile(SCHEMA_PATH, 'utf-8')
  await client.query(sql)
  console.log('✓ Schema 创建完成')
}

/** 导入产品景点数据（含标签关联） */
async function seedAttractions(client: pg.PoolClient) {
  const raw = await readFile(PRODUCT_PATH, 'utf-8')
  const attractions: AttractionProduct[] = JSON.parse(raw)

  const tagSet = new Set<string>()
  for (const item of attractions) {
    for (const tag of item.tags || [])
      tagSet.add(tag)
  }

  const tagMap = new Map<string, string>()
  for (const tagName of tagSet) {
    const result = await client.query(
      'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [tagName],
    )
    tagMap.set(tagName, result.rows[0].id)
  }
  console.log(`✓ 导入 ${tagMap.size} 个标签`)

  let count = 0
  for (const item of attractions) {
    await client.query(
      `INSERT INTO attractions (
        id, name, city, ticket_type, price_text, cover_image,
        summary, description, address, opening_hours,
        recommended_duration, aliases, highlights, tips,
        suitable_for, booking_links
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, city = EXCLUDED.city,
        ticket_type = EXCLUDED.ticket_type, price_text = EXCLUDED.price_text,
        cover_image = EXCLUDED.cover_image, summary = EXCLUDED.summary,
        description = EXCLUDED.description, address = EXCLUDED.address,
        opening_hours = EXCLUDED.opening_hours,
        recommended_duration = EXCLUDED.recommended_duration,
        aliases = EXCLUDED.aliases, highlights = EXCLUDED.highlights,
        tips = EXCLUDED.tips, suitable_for = EXCLUDED.suitable_for,
        booking_links = EXCLUDED.booking_links,
        updated_at = NOW()`,
      [
        item.id,
        item.name,
        item.city,
        item.ticketType,
        item.priceText,
        item.coverImage,
        item.summary,
        item.description,
        item.address,
        item.openingHours,
        item.recommendedDuration,
        item.aliases || [],
        item.highlights || [],
        item.tips || [],
        item.suitableFor || [],
        JSON.stringify(item.bookingLinks || {}),
      ],
    )

    for (const tagName of item.tags || []) {
      const tagId = tagMap.get(tagName)
      if (tagId) {
        await client.query(
          'INSERT INTO attraction_tags (attraction_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [item.id, tagId],
        )
      }
    }
    count++
  }
  console.log(`✓ 导入 ${count} 个景点`)
}

/** 导入 RAG 知识库数据 */
async function seedKnowledge(client: pg.PoolClient) {
  const raw = await readFile(KNOWLEDGE_PATH, 'utf-8')
  const cities: KnowledgeCity[] = JSON.parse(raw)

  let count = 0
  for (const cityData of cities) {
    for (const attr of cityData.attractions) {
      await client.query(
        `INSERT INTO attraction_knowledge (
          city, name, description, ticket, duration, tips, indoor, tags,
          food, transport, best_season, accommodation, nightlife
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (city, name) DO UPDATE SET
          description = EXCLUDED.description, ticket = EXCLUDED.ticket,
          duration = EXCLUDED.duration, tips = EXCLUDED.tips,
          indoor = EXCLUDED.indoor, tags = EXCLUDED.tags,
          food = EXCLUDED.food, transport = EXCLUDED.transport,
          best_season = EXCLUDED.best_season,
          accommodation = EXCLUDED.accommodation,
          nightlife = EXCLUDED.nightlife`,
        [
          cityData.city,
          attr.name,
          attr.description,
          attr.ticket,
          attr.duration,
          attr.tips || '',
          attr.indoor || false,
          attr.tags || [],
          cityData.food || [],
          cityData.transport || '',
          cityData.bestSeason || '',
          JSON.stringify(cityData.accommodation || []),
          JSON.stringify(cityData.nightlife || []),
        ],
      )
      count++
    }
  }
  console.log(`✓ 导入 ${count} 条 RAG 知识库`)
}

// ========== 主入口 ==========

async function main() {
  const client = await pool.connect()
  try {
    console.log('开始迁移...')
    await runSchema(client)
    await seedAttractions(client)
    await seedKnowledge(client)
    console.log('迁移完成!')
  }
  finally {
    client.release()
    await pool.end()
  }
}

main().catch((err: Error) => {
  console.error('迁移失败:', err.message)
  process.exit(1)
})
