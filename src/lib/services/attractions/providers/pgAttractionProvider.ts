/**
 * PostgreSQL 景点数据 Provider
 * 实现与 localAttractionProvider 相同的接口，数据来自 PostgreSQL
 */
import { query, typedQuery } from '../../../db'

export interface AttractionItem {
  address: string
  aliases: string[]
  bookingLinks: Record<string, unknown>
  city: string
  coverImage: string
  description: string
  highlights: string[]
  id: string
  name: string
  openingHours: string
  priceText: string
  recommendedDuration: string
  suitableFor: string[]
  summary: string
  tags: string[]
  ticketType: string
  tips: string[]
}

interface AttractionRow {
  address: string
  aliases?: string[]
  booking_links?: Record<string, unknown>
  city: string
  cover_image: string
  description: string
  highlights?: string[]
  id: string
  name: string
  opening_hours: string
  price_text: string
  recommended_duration: string
  suitable_for?: string[]
  summary: string
  tags?: string[]
  ticket_type: string
  tips?: string[]
}

/** 城市显示排序，热门城市排在前面 */
const CITY_ORDER = ['北京', '上海', '杭州', '成都', '西安']

interface ListFilters {
  city?: string
  keyword?: string
  page?: number | string
  pageSize?: number | string
  tag?: string
  ticketType?: string
}

/** 根据 ID 获取景点详情 */
async function getAttractionById(id: string): Promise<AttractionItem | null> {
  const result = await query(
    `SELECT a.*, COALESCE(ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
     FROM attractions a
     LEFT JOIN attraction_tags at2 ON at2.attraction_id = a.id
     LEFT JOIN tags t ON t.id = at2.tag_id
     WHERE a.id = $1
     GROUP BY a.id`,
    [id],
  )

  return result.rows.length > 0 ? mapRow(typedQuery<AttractionRow>(result.rows)[0]) : null
}

/** 获取所有城市列表（按预设排序）和标签列表 */
async function getAttractionMeta(): Promise<{ cities: string[]; tags: string[] }> {
  const [cityResult, tagResult] = await Promise.all([
    query('SELECT DISTINCT city FROM attractions ORDER BY city'),
    query('SELECT name FROM tags ORDER BY name'),
  ])

  const dbCities = cityResult.rows.map((r: { city: string }) => r.city)
  const orderedCities = [
    ...CITY_ORDER.filter((c) => dbCities.includes(c)),
    ...dbCities.filter((c) => !CITY_ORDER.includes(c)),
  ]

  return {
    cities: orderedCities,
    tags: tagResult.rows.map((r: { name: string }) => r.name),
  }
}

/** 分页查询景点列表，支持城市、关键词、票型、标签等多条件过滤 */
async function listAttractions(
  filters: ListFilters = {},
): Promise<{ items: AttractionItem[]; total: number }> {
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIndex = 1

  if (filters.city) {
    conditions.push(`a.city = $${paramIndex++}`)
    params.push(filters.city)
  }

  if (filters.ticketType) {
    conditions.push(`a.ticket_type = $${paramIndex++}`)
    params.push(filters.ticketType)
  }

  if (filters.tag) {
    conditions.push(
      `EXISTS (SELECT 1 FROM attraction_tags at2 JOIN tags t ON t.id = at2.tag_id WHERE at2.attraction_id = a.id AND t.name = $${paramIndex++})`,
    )
    params.push(filters.tag)
  }

  if (filters.keyword) {
    const kw = `%${filters.keyword}%`
    conditions.push(
      `(a.name ILIKE $${paramIndex} OR a.city ILIKE $${paramIndex} OR a.summary ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex} OR $${paramIndex} = ANY(a.aliases))`,
    )
    params.push(kw)
    paramIndex++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const page = Math.max(1, Number(filters.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20))
  const offset = (page - 1) * pageSize

  const dataSql = `
    SELECT a.*, COALESCE(ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
    FROM attractions a
    LEFT JOIN attraction_tags at2 ON at2.attraction_id = a.id
    LEFT JOIN tags t ON t.id = at2.tag_id
    ${where}
    GROUP BY a.id
    ORDER BY a.city, a.name
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `
  params.push(pageSize, offset)

  const countSql = `SELECT COUNT(DISTINCT a.id) FROM attractions a ${where}`
  const countParams = params.slice(0, -2)

  const [dataResult, countResult] = await Promise.all([
    query(dataSql, params),
    query(countSql, countParams),
  ])

  return {
    items: dataResult.rows.map(mapRow),
    total: Number(countResult.rows[0].count),
  }
}

/** 将数据库行映射为 AttractionItem（snake_case → camelCase） */
function mapRow(row: AttractionRow): AttractionItem {
  return {
    address: row.address,
    aliases: row.aliases || [],
    bookingLinks: row.booking_links || {},
    city: row.city,
    coverImage: row.cover_image,
    description: row.description,
    highlights: row.highlights || [],
    id: row.id,
    name: row.name,
    openingHours: row.opening_hours,
    priceText: row.price_text,
    recommendedDuration: row.recommended_duration,
    suitableFor: row.suitable_for || [],
    summary: row.summary,
    tags: row.tags || [],
    ticketType: row.ticket_type,
    tips: row.tips || [],
  }
}

async function searchAttractions(
  filters: ListFilters = {},
): Promise<{ items: AttractionItem[]; total: number }> {
  return listAttractions(filters)
}

export { getAttractionById, getAttractionMeta, listAttractions, searchAttractions }
