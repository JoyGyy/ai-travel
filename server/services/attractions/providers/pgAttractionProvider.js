/**
 * PostgreSQL 景点数据 Provider
 * 实现与 localAttractionProvider 相同的接口，数据来自 PostgreSQL
 */

import { query } from '../../../db/index.js'

const CITY_ORDER = ['北京', '上海', '杭州', '成都', '西安']

/**
 * 将数据库行映射为前端 Attraction 对象
 */
function mapRow(row) {
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

/**
 * 列出景点（支持筛选 + 分页）
 * @param {object} filters - { city?, keyword?, ticketType?, tag?, page?, pageSize? }
 * @returns {Promise<{ items: object[], total: number }>}
 */
async function listAttractions(filters = {}) {
  const conditions = []
  const params = []
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

  // 分页
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
  const countParams = params.slice(0, -2) // 去掉 LIMIT/OFFSET 参数

  const [dataResult, countResult] = await Promise.all([
    query(dataSql, params),
    query(countSql, countParams),
  ])

  return {
    items: dataResult.rows.map(mapRow),
    total: Number(countResult.rows[0].count),
  }
}

/**
 * 根据 ID 获取景点
 * @param {string} id
 * @returns {Promise<object|null>}
 */
async function getAttractionById(id) {
  const result = await query(
    `SELECT a.*, COALESCE(ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
     FROM attractions a
     LEFT JOIN attraction_tags at2 ON at2.attraction_id = a.id
     LEFT JOIN tags t ON t.id = at2.tag_id
     WHERE a.id = $1
     GROUP BY a.id`,
    [id],
  )
  return result.rows.length > 0 ? mapRow(result.rows[0]) : null
}

/**
 * 获取筛选元数据（城市列表 + 标签列表）
 * @returns {Promise<{ cities: string[], tags: string[] }>}
 */
async function getAttractionMeta() {
  const [cityResult, tagResult] = await Promise.all([
    query('SELECT DISTINCT city FROM attractions ORDER BY city'),
    query('SELECT name FROM tags ORDER BY name'),
  ])

  const dbCities = cityResult.rows.map(r => r.city)
  // 保持预设城市排序，新增城市排在末尾
  const orderedCities = [
    ...CITY_ORDER.filter(c => dbCities.includes(c)),
    ...dbCities.filter(c => !CITY_ORDER.includes(c)),
  ]

  return {
    cities: orderedCities,
    tags: tagResult.rows.map(r => r.name),
  }
}

/**
 * 搜索景点（别名给 RAG 用，逻辑同 listAttractions）
 * @param {object} filters
 * @returns {Promise<object[]>}
 */
function searchAttractions(filters = {}) {
  return listAttractions(filters)
}

export {
  getAttractionById,
  getAttractionMeta,
  listAttractions,
  searchAttractions,
}
