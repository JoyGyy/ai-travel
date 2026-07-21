/**
 * PostgreSQL 景点数据 Provider
 * 实现与 localAttractionProvider 相同的接口，数据来自 PostgreSQL
 */
import { query } from '../../../db/index.js'

export interface AttractionItem {
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

interface AttractionRow {
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
  tags?: string[]
  aliases?: string[]
  highlights?: string[]
  tips?: string[]
  suitable_for?: string[]
  booking_links?: Record<string, unknown>
}

const CITY_ORDER = ['北京', '上海', '杭州', '成都', '西安']

function mapRow(row: AttractionRow): AttractionItem {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    ticketType: row.ticket_type,
    priceText: row.price_text,
    coverImage: row.cover_image,
    summary: row.summary,
    description: row.description,
    address: row.address,
    openingHours: row.opening_hours,
    recommendedDuration: row.recommended_duration,
    tags: row.tags || [],
    aliases: row.aliases || [],
    highlights: row.highlights || [],
    tips: row.tips || [],
    suitableFor: row.suitable_for || [],
    bookingLinks: row.booking_links || {},
  }
}

interface ListFilters {
  city?: string
  keyword?: string
  ticketType?: string
  tag?: string
  page?: number | string
  pageSize?: number | string
}

async function listAttractions(filters: ListFilters = {}): Promise<{ items: AttractionItem[], total: number }> {
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
    conditions.push(`EXISTS (SELECT 1 FROM attraction_tags at2 JOIN tags t ON t.id = at2.tag_id WHERE at2.attraction_id = a.id AND t.name = $${paramIndex++})`)
    params.push(filters.tag)
  }

  if (filters.keyword) {
    const kw = `%${filters.keyword}%`
    conditions.push(`(a.name ILIKE $${paramIndex} OR a.city ILIKE $${paramIndex} OR a.summary ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex} OR $${paramIndex} = ANY(a.aliases))`)
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
  return result.rows.length > 0 ? mapRow(result.rows[0] as AttractionRow) : null
}

async function getAttractionMeta(): Promise<{ cities: string[], tags: string[] }> {
  const [cityResult, tagResult] = await Promise.all([
    query('SELECT DISTINCT city FROM attractions ORDER BY city'),
    query('SELECT name FROM tags ORDER BY name'),
  ])

  const dbCities = cityResult.rows.map(r => r.city)
  const orderedCities = [
    ...CITY_ORDER.filter(c => dbCities.includes(c)),
    ...dbCities.filter(c => !CITY_ORDER.includes(c)),
  ]

  return {
    cities: orderedCities,
    tags: tagResult.rows.map(r => r.name),
  }
}

async function searchAttractions(filters: ListFilters = {}): Promise<{ items: AttractionItem[], total: number }> {
  return listAttractions(filters)
}

export {
  getAttractionById,
  getAttractionMeta,
  listAttractions,
  searchAttractions,
}
