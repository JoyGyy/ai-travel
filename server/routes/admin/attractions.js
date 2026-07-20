/**
 * 景点管理 API
 * 提供景点 CRUD 操作，仅限已认证用户
 */

import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { query, getClient } from '../../db/index.js'
import { isDbReady } from '../../db/index.js'
import { asyncHandler, httpError } from '../../utils/http.js'
import { readRequiredString } from '../../utils/validation.js'

const router = Router()

// 所有管理接口都需要认证和数据库
router.use(requireAuth)
router.use((req, res, next) => {
  if (!isDbReady()) throw httpError(503, '数据库未配置')
  next()
})

/** 列出全部景点（管理用，支持分页） */
router.get('/', asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20))
  const offset = (page - 1) * pageSize

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT a.*, COALESCE(ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
       FROM attractions a
       LEFT JOIN attraction_tags at2 ON at2.attraction_id = a.id
       LEFT JOIN tags t ON t.id = at2.tag_id
       GROUP BY a.id
       ORDER BY a.city, a.name
       LIMIT $1 OFFSET $2`,
      [pageSize, offset],
    ),
    query('SELECT COUNT(*) FROM attractions'),
  ])

  res.json({
    success: true,
    data: {
      items: dataResult.rows.map(mapRow),
      total: Number(countResult.rows[0].count),
      page,
      pageSize,
    },
  })
}))

/** 获取单个景点详情 */
router.get('/:id', asyncHandler(async (req, res) => {
  const result = await query(
    `SELECT a.*, COALESCE(ARRAY_AGG(t.name ORDER BY t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
     FROM attractions a
     LEFT JOIN attraction_tags at2 ON at2.attraction_id = a.id
     LEFT JOIN tags t ON t.id = at2.tag_id
     WHERE a.id = $1
     GROUP BY a.id`,
    [req.params.id],
  )

  if (result.rows.length === 0) throw httpError(404, '景点不存在')
  res.json({ success: true, data: mapRow(result.rows[0]) })
}))

/** 创建景点 */
router.post('/', asyncHandler(async (req, res) => {
  const data = readAttractionBody(req.body)
  const client = await getClient()

  try {
    await client.query('BEGIN')

    await client.query(
      `INSERT INTO attractions (
        id, name, city, ticket_type, price_text, cover_image,
        summary, description, address, opening_hours,
        recommended_duration, aliases, highlights, tips,
        suitable_for, booking_links
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        data.id, data.name, data.city, data.ticketType, data.priceText, data.coverImage,
        data.summary, data.description, data.address, data.openingHours,
        data.recommendedDuration, data.aliases, data.highlights, data.tips,
        data.suitableFor, JSON.stringify(data.bookingLinks),
      ],
    )

    await syncTags(client, data.id, data.tags)
    await client.query('COMMIT')

    res.status(201).json({ success: true, data: { id: data.id } })
  }
  catch (err) {
    await client.query('ROLLBACK')
    if (err.code === '23505') throw httpError(409, '景点 ID 已存在')
    throw err
  }
  finally {
    client.release()
  }
}))

/** 更新景点 */
router.put('/:id', asyncHandler(async (req, res) => {
  const id = req.params.id
  const data = readAttractionBody(req.body, id)
  const client = await getClient()

  try {
    await client.query('BEGIN')

    const result = await client.query(
      `UPDATE attractions SET
        name = $2, city = $3, ticket_type = $4, price_text = $5,
        cover_image = $6, summary = $7, description = $8,
        address = $9, opening_hours = $10, recommended_duration = $11,
        aliases = $12, highlights = $13, tips = $14,
        suitable_for = $15, booking_links = $16, updated_at = NOW()
       WHERE id = $1`,
      [
        id, data.name, data.city, data.ticketType, data.priceText,
        data.coverImage, data.summary, data.description, data.address,
        data.openingHours, data.recommendedDuration, data.aliases,
        data.highlights, data.tips, data.suitableFor,
        JSON.stringify(data.bookingLinks),
      ],
    )

    if (result.rowCount === 0) throw httpError(404, '景点不存在')

    // 删除旧标签关联后重新同步
    await client.query('DELETE FROM attraction_tags WHERE attraction_id = $1', [id])
    await syncTags(client, id, data.tags)
    await client.query('COMMIT')

    res.json({ success: true, data: { id } })
  }
  catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
  finally {
    client.release()
  }
}))

/** 删除景点 */
router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await query('DELETE FROM attractions WHERE id = $1', [req.params.id])
  if (result.rowCount === 0) throw httpError(404, '景点不存在')
  res.json({ success: true, message: '已删除' })
}))

// ========== 辅助函数 ==========

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
 * 从请求体解析并校验景点字段
 */
function readAttractionBody(body, defaultId) {
  const id = defaultId || readRequiredString(body.id, '景点 ID', { min: 1, max: 100 })
  return {
    id,
    name: readRequiredString(body.name, '景点名称', { max: 200 }),
    city: readRequiredString(body.city, '城市', { max: 50 }),
    ticketType: ['free', 'paid'].includes(body.ticketType) ? body.ticketType : 'free',
    priceText: String(body.priceText || ''),
    coverImage: String(body.coverImage || ''),
    summary: String(body.summary || ''),
    description: String(body.description || ''),
    address: String(body.address || ''),
    openingHours: String(body.openingHours || ''),
    recommendedDuration: String(body.recommendedDuration || ''),
    tags: Array.isArray(body.tags) ? body.tags : [],
    aliases: Array.isArray(body.aliases) ? body.aliases : [],
    highlights: Array.isArray(body.highlights) ? body.highlights : [],
    tips: Array.isArray(body.tips) ? body.tips : [],
    suitableFor: Array.isArray(body.suitableFor) ? body.suitableFor : [],
    bookingLinks: typeof body.bookingLinks === 'object' ? body.bookingLinks : {},
  }
}

/**
 * 同步景点标签（确保标签存在 + 建立关联）
 */
async function syncTags(client, attractionId, tags) {
  for (const tagName of tags) {
    const tagResult = await client.query(
      'INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id',
      [tagName],
    )
    await client.query(
      'INSERT INTO attraction_tags (attraction_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [attractionId, tagResult.rows[0].id],
    )
  }
}

export default router
