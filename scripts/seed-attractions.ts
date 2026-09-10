/**
 * 景点数据种子脚本（事务安全）
 *
 * 用法:
 *   pnpm db:seed:attractions -- --dry-run   — 仅校验资产与行数，不连接数据库
 *   pnpm db:seed:attractions                — 在单个事务中 UPSERT 60 条景点及标签关系
 *
 * 需要 DATABASE_URL 环境变量：
 *   pnpm exec tsx --env-file=.env scripts/seed-attractions.ts
 */
import pg from 'pg'

import { env } from '../src/lib/env'
import attractions from '../src/knowledge/attractions-product.json'
import { verifyImageAssets } from './verify-image-assets'

const { Pool } = pg

export interface AttractionRow {
  id: string
  name: string
  city: string
  ticket_type: string
  price_text: string
  cover_image: string
  summary: string
  description: string
  address: string
  opening_hours: string
  recommended_duration: string
  aliases: string[]
  highlights: string[]
  tips: string[]
  suitable_for: string[]
  booking_links: Record<string, unknown>
  tags: string[]
}

interface CatalogEntry {
  id: string
  name: string
  city: string
  ticketType?: string
  priceText?: string
  coverImage: string
  summary?: string
  description?: string
  address?: string
  openingHours?: string
  recommendedDuration?: string
  aliases?: string[]
  highlights?: string[]
  tips?: string[]
  suitableFor?: string[]
  bookingLinks?: Record<string, unknown>
  tags?: string[]
}

/** 将目录条目映射为数据库行（camelCase → snake_case）。 */
export function mapAttractionToRow(entry: CatalogEntry): AttractionRow {
  return {
    id: entry.id,
    name: entry.name,
    city: entry.city,
    ticket_type: entry.ticketType ?? 'free',
    price_text: entry.priceText ?? '',
    cover_image: entry.coverImage,
    summary: entry.summary ?? '',
    description: entry.description ?? '',
    address: entry.address ?? '',
    opening_hours: entry.openingHours ?? '',
    recommended_duration: entry.recommendedDuration ?? '',
    aliases: entry.aliases ?? [],
    highlights: entry.highlights ?? [],
    tips: entry.tips ?? [],
    suitable_for: entry.suitableFor ?? [],
    booking_links: entry.bookingLinks ?? {},
    tags: entry.tags ?? [],
  }
}

/** 与 seedAttractions 兼容的最小查询客户端（便于测试注入 fake）。 */
export interface QueryClient {
  query: (text: string, params?: unknown[]) => Promise<unknown>
}

const ATTRACTION_COLUMNS = [
  'id', 'name', 'city', 'ticket_type', 'price_text', 'cover_image',
  'summary', 'description', 'address', 'opening_hours', 'recommended_duration',
  'aliases', 'highlights', 'tips', 'suitable_for', 'booking_links', 'updated_at',
] as const

function buildUpsertSql(): string {
  const placeholders = ATTRACTION_COLUMNS.map((_, i) => `$${i + 1}`).join(', ')
  // created_at 不在列清单中，故仅需排除主键 id。
  const setClause = ATTRACTION_COLUMNS
    .filter(column => column !== 'id')
    .map(column => `${column} = EXCLUDED.${column}`)
    .join(', ')

  return `
    INSERT INTO attractions (${ATTRACTION_COLUMNS.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (id) DO UPDATE SET ${setClause}
  `
}

/**
 * 在单个事务中 UPSERT 所有景点、标签及景点-标签关系。
 * 成功提交返回行数；任一步失败则整体回滚。
 */
export async function seedAttractions(client: QueryClient, rows: AttractionRow[]): Promise<number> {
  const upsertSql = buildUpsertSql()

  await client.query('BEGIN')
  try {
    for (const row of rows) {
      const {
        id, tags, aliases, highlights, tips, suitable_for, booking_links,
        ...fields
      } = row

      const params: unknown[] = [
        id,
        fields.name,
        fields.city,
        fields.ticket_type,
        fields.price_text,
        fields.cover_image,
        fields.summary,
        fields.description,
        fields.address,
        fields.opening_hours,
        fields.recommended_duration,
        aliases,
        highlights,
        tips,
        suitable_for,
        JSON.stringify(booking_links),
        new Date(),
      ]
      await client.query(upsertSql, params)

      // 仅重建该景点的标签关系：先删除旧的关联，再插入新的。
      await client.query('DELETE FROM attraction_tags WHERE attraction_id = $1', [id])

      // 标签：upsert 并取回 id，始终返回一行。
      for (const tag of tags) {
        const result = await client.query(
          `INSERT INTO tags (name) VALUES ($1)
           ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [tag],
        )
        const tagId = result && 'rows' in (result as { rows?: unknown[] })
          ? (result as { rows: { id: unknown }[] }).rows[0].id
          : undefined
        if (tagId === undefined) {
          throw new Error(`无法确定标签 id: ${tag}`)
        }

        await client.query(
          `INSERT INTO attraction_tags (attraction_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [id, tagId],
        )
      }
    }

    await client.query('COMMIT')
  }
  catch (error) {
    await client.query('ROLLBACK')
    throw error
  }

  return rows.length
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run')

  // 1. 资产校验（60 景点、10 城市、60 本地 WebP、版权记录）
  verifyImageAssets()

  const rows = attractions.map(mapAttractionToRow)
  const cityCount = new Set(rows.map(row => row.city)).size

  if (dryRun) {
    console.log(`[dry-run] 校验通过: ${rows.length} 条景点, ${cityCount} 个城市`)
    console.log('[dry-run] 未连接数据库，未写入任何数据')
    return
  }

  if (!env.DATABASE_URL) {
    throw new Error('缺少 DATABASE_URL 环境变量，无法连接数据库')
  }

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    connectionTimeoutMillis: 5_000,
  })
  const client = await pool.connect()
  try {
    const count = await seedAttractions(client, rows)
    console.log(`成功提交 ${count} 条景点（含标签关系）`)
  }
  finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
