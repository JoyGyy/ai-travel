/**
 * 社区领域服务
 * 负责帖子、图片、点赞、评论和转发的 PostgreSQL 数据访问。
 */
import type { PoolClient } from 'pg'

import { getClient, query, typedQuery } from '../db'
import { httpError } from '../utils/http'

export interface CommunityAuthor {
  id: string
  username: string
}

export interface CommunityComment {
  author: CommunityAuthor
  content: string
  createdAt: string
  id: string
  postId: string
  updatedAt: string
}

export interface CommunityCommentListData {
  items: CommunityComment[]
  page: number
  pageSize: number
  total: number
}

export interface CommunityImage {
  altText: string
  createdAt: string
  id: string
  sortOrder: number
  storageKey: string
  url: string
}

export interface CommunityImageInput {
  altText?: string
  storageKey: string
  url: string
}

export interface CommunityListFilters {
  authorId: string
  city: string
  page: number
  pageSize: number
  withItinerary: boolean
}

export interface CommunityPost extends CommunityPostSummary {
  originalPost: CommunityPostSummary | null
}

export interface CommunityPostListData {
  items: CommunityPost[]
  page: number
  pageSize: number
  total: number
}

export interface CommunityPostSummary {
  author: CommunityAuthor
  city: string
  commentCount: number
  content: string
  createdAt: string
  id: string
  images: CommunityImage[]
  itinerarySnapshot: null | unknown
  likeCount: number
  likedByMe: boolean
  postType: CommunityPostType
  repostCount: number
  title: string
  updatedAt: string
}

export type CommunityPostType = 'original' | 'repost'

export interface CreateCommunityCommentResult {
  comment: CommunityComment
  commentCount: number
}

export interface CreateCommunityPostInput {
  city?: string
  content?: string
  images?: CommunityImageInput[]
  itinerarySnapshot?: unknown
  title?: string
}

export interface LikeCommunityPostResult {
  likeCount: number
  likedByMe: boolean
}

interface CommunityCommentRow {
  author_id: string
  author_username: string
  content: string
  created_at: Date | string
  id: string
  post_id: string
  updated_at: Date | string
}

interface CommunityImageRow {
  alt_text: string
  created_at: Date | string
  id: string
  post_id: string
  sort_order: number
  storage_key: string
  url: string
}

interface CommunityPostRow {
  author_id: string
  author_username: string
  city: string
  comment_count: number | string
  content: string
  created_at: Date | string
  id: string
  itinerary_snapshot: null | unknown
  like_count: number | string
  liked_by_me: boolean
  original_post_id: null | string
  post_type: CommunityPostType
  repost_count: number | string
  title: string
  updated_at: Date | string
}

interface RepostTargetRow {
  city: string
  id: string
  original_post_id: null | string
  post_type: CommunityPostType
}

/** 创建评论 */
export async function createCommunityComment(
  postId: string,
  authorId: string,
  content: string,
): Promise<CreateCommunityCommentResult> {
  await ensurePostExists(postId)
  const { nanoid } = await import('nanoid')
  const id = nanoid(12)

  const inserted = await query(
    `INSERT INTO community_post_comments (id, post_id, author_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, post_id, author_id, content, created_at, updated_at`,
    [id, postId, authorId, content],
  )

  const userResult = await query('SELECT username FROM users WHERE id = $1', [authorId])
  const authorUsername = userResult.rows[0]?.username || ''
  const row = inserted.rows[0]

  return {
    comment: mapCommentRow({
      author_id: row.author_id,
      author_username: authorUsername,
      content: row.content,
      created_at: row.created_at,
      id: row.id,
      post_id: row.post_id,
      updated_at: row.updated_at,
    }),
    commentCount: await getCommentCount(postId),
  }
}

/** 创建社区原帖 */
export async function createCommunityPost(
  authorId: string,
  input: CreateCommunityPostInput,
): Promise<CommunityPost> {
  const client = await getClient()
  try {
    await client.query('BEGIN')
    const id = await insertPost(client, authorId, { ...input, originalPostId: null, postType: 'original' })
    await client.query('COMMIT')

    const post = await getCommunityPostById(id, authorId)
    if (!post) throw httpError(500, '帖子创建后读取失败')
    return post
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

/** 软删除自己的评论 */
export async function deleteCommunityComment(commentId: string, authorId: string): Promise<void> {
  const result = await query(
    'SELECT author_id FROM community_post_comments WHERE id = $1 AND deleted_at IS NULL',
    [commentId],
  )

  if (result.rows.length === 0) throw httpError(404, '评论不存在或已删除')
  if (result.rows[0].author_id !== authorId) throw httpError(403, '只能删除自己的评论')

  await query(
    'UPDATE community_post_comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [commentId],
  )
}

/** 软删除自己的帖子 */
export async function deleteCommunityPost(postId: string, authorId: string): Promise<void> {
  const result = await query(
    'SELECT author_id FROM community_posts WHERE id = $1 AND deleted_at IS NULL',
    [postId],
  )

  if (result.rows.length === 0) throw httpError(404, '帖子不存在或已删除')
  if (result.rows[0].author_id !== authorId) throw httpError(403, '只能删除自己的帖子')

  await query(
    'UPDATE community_posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1',
    [postId],
  )
}

/** 查询帖子详情 */
export async function getCommunityPostById(
  id: string,
  viewerId?: string,
): Promise<CommunityPost | null> {
  const viewerIdValue = viewerId || ''
  const result = await query(
    `${basePostSelect(viewerIdValue)} WHERE p.deleted_at IS NULL AND p.id = $1`,
    [id],
  )

  if (result.rows.length === 0) return null

  const [post] = await hydratePosts(typedQuery<CommunityPostRow>(result.rows), viewerId)
  return post
}

/** 点赞帖子，重复点赞保持幂等 */
export async function likeCommunityPost(
  postId: string,
  userId: string,
): Promise<LikeCommunityPostResult> {
  await ensurePostExists(postId)
  await query(
    'INSERT INTO community_post_likes (post_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [postId, userId],
  )

  return { likeCount: await getLikeCount(postId), likedByMe: true }
}

/** 查询帖子评论列表 */
export async function listCommunityComments(
  postId: string,
  page = 1,
  pageSize = 20,
): Promise<CommunityCommentListData> {
  await ensurePostExists(postId)
  const normalizedPage = Math.max(1, page || 1)
  const normalizedPageSize = Math.min(50, Math.max(1, pageSize || 20))
  const offset = (normalizedPage - 1) * normalizedPageSize

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT c.id, c.post_id, c.author_id, u.username AS author_username,
              c.content, c.created_at, c.updated_at
       FROM community_post_comments c
       INNER JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [postId, normalizedPageSize, offset],
    ),
    query(
      'SELECT COUNT(*)::int AS cnt FROM community_post_comments WHERE post_id = $1 AND deleted_at IS NULL',
      [postId],
    ),
  ])

  return {
    items: dataResult.rows.map((row: CommunityCommentRow) =>
      mapCommentRow({
        author_id: row.author_id,
        author_username: row.author_username,
        content: row.content,
        created_at: row.created_at,
        id: row.id,
        post_id: row.post_id,
        updated_at: row.updated_at,
      }),
    ),
    page: normalizedPage,
    pageSize: normalizedPageSize,
    total: countResult.rows[0]?.cnt ?? 0,
  }
}

/** 查询社区帖子列表 */
export async function listCommunityPosts(
  filters: CommunityListFilters,
  viewerId?: string,
): Promise<CommunityPostListData> {
  const page = Math.max(1, filters.page || 1)
  const pageSize = Math.min(30, Math.max(1, filters.pageSize || 10))
  const offset = (page - 1) * pageSize
  const viewerIdValue = viewerId || ''

  // 构建过滤条件
  const conditions: string[] = ['p.deleted_at IS NULL']
  const params: unknown[] = []
  let paramIndex = 1

  if (filters.city) {
    conditions.push(`p.city = $${paramIndex++}`)
    params.push(filters.city)
  }

  if (filters.withItinerary) {
    conditions.push('p.itinerary_snapshot IS NOT NULL')
  }

  if (filters.authorId) {
    conditions.push(`p.author_id = $${paramIndex++}`)
    params.push(filters.authorId)
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countSql = `SELECT COUNT(*)::int AS cnt FROM community_posts p ${whereClause}`
  const dataSql = `${basePostSelect(viewerIdValue)} ${whereClause} ORDER BY p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`

  const [countResult, dataResult] = await Promise.all([
    query(countSql, params),
    query(dataSql, [...params, pageSize, offset]),
  ])

  return {
    items: await hydratePosts(typedQuery<CommunityPostRow>(dataResult.rows), viewerId),
    page,
    pageSize,
    total: countResult.rows[0]?.cnt ?? 0,
  }
}

/** 转发帖子，转发转发帖时归一到最初原帖 */
export async function repostCommunityPost(
  postId: string,
  authorId: string,
  content = '',
): Promise<CommunityPost> {
  const target = await getRepostTarget(postId)
  const originalPostId = target.original_post_id || target.id
  await ensurePostExists(originalPostId)

  const client = await getClient()
  let newPostId: string
  try {
    await client.query('BEGIN')
    newPostId = await insertPost(client, authorId, {
      city: target.city,
      content,
      originalPostId,
      postType: 'repost',
    })
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  const post = await getCommunityPostById(newPostId, authorId)
  if (!post) throw httpError(500, '转发创建后读取失败')
  return post
}

/** 取消点赞 */
export async function unlikeCommunityPost(
  postId: string,
  userId: string,
): Promise<LikeCommunityPostResult> {
  await ensurePostExists(postId)
  await query(
    'DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2',
    [postId, userId],
  )
  return { likeCount: await getLikeCount(postId), likedByMe: false }
}

/** 构建帖子列表的基础 SQL（含 LATERAL JOIN 聚合计数和当前用户点赞状态） */
function basePostSelect(viewerId: string) {
  // 使用 $1 作为 viewerId 参数占位，调用方需将 viewerId 作为第一个参数传入
  return `
    SELECT
      p.id,
      p.author_id,
      u.username AS author_username,
      p.post_type,
      p.original_post_id,
      p.title,
      p.content,
      p.city,
      p.itinerary_snapshot,
      p.created_at,
      p.updated_at,
      COALESCE(like_stats.like_count, 0) AS like_count,
      COALESCE(comment_stats.comment_count, 0) AS comment_count,
      COALESCE(repost_stats.repost_count, 0) AS repost_count,
      EXISTS (
        SELECT 1 FROM community_post_likes viewer_like
        WHERE viewer_like.post_id = p.id AND viewer_like.user_id = '${viewerId}'
      ) AS liked_by_me
    FROM community_posts p
    JOIN users u ON u.id = p.author_id
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS like_count
      FROM community_post_likes l
      WHERE l.post_id = p.id
    ) like_stats ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS comment_count
      FROM community_post_comments c
      WHERE c.post_id = p.id AND c.deleted_at IS NULL
    ) comment_stats ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS repost_count
      FROM community_posts rp
      WHERE rp.original_post_id = p.id AND rp.deleted_at IS NULL
    ) repost_stats ON true
  `
}

async function ensurePostExists(postId: string): Promise<void> {
  const result = await query(
    'SELECT id FROM community_posts WHERE id = $1 AND deleted_at IS NULL',
    [postId],
  )

  if (result.rows.length === 0) throw httpError(404, '帖子不存在或已删除')
}

async function getCommentCount(postId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*)::int AS cnt FROM community_post_comments WHERE post_id = $1 AND deleted_at IS NULL',
    [postId],
  )

  return result.rows[0]?.cnt ?? 0
}

async function getImagesByPostIds(postIds: string[]): Promise<Map<string, CommunityImage[]>> {
  const imageMap = new Map<string, CommunityImage[]>()
  for (const postId of postIds) imageMap.set(postId, [])

  if (postIds.length === 0) return imageMap

  const result = await query(
    `SELECT id, post_id, url, storage_key, alt_text, sort_order, created_at
     FROM community_post_images
     WHERE post_id = ANY($1::text[])
     ORDER BY post_id, sort_order, created_at`,
    [postIds],
  )

  for (const row of result.rows) {
    const images = imageMap.get(row.post_id) || []
    images.push(
      mapImageRow({
        alt_text: row.alt_text,
        created_at: row.created_at,
        id: row.id,
        post_id: row.post_id,
        sort_order: row.sort_order,
        storage_key: row.storage_key,
        url: row.url,
      }),
    )
    imageMap.set(row.post_id, images)
  }

  return imageMap
}

async function getLikeCount(postId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*)::int AS cnt FROM community_post_likes WHERE post_id = $1',
    [postId],
  )

  return result.rows[0]?.cnt ?? 0
}

async function getOriginalSummaryMap(
  originalIds: string[],
  viewerId?: string,
): Promise<Map<string, CommunityPostSummary>> {
  const summaryMap = new Map<string, CommunityPostSummary>()
  if (originalIds.length === 0) return summaryMap

  const viewerIdValue = viewerId || ''
  const result = await query(
    `${basePostSelect(viewerIdValue)} WHERE p.deleted_at IS NULL AND p.id = ANY($1::text[])`,
    [originalIds],
  )

  const postRows = typedQuery<CommunityPostRow>(result.rows)
  const imageMap = await getImagesByPostIds(postRows.map((row) => row.id))
  for (const row of postRows)
    summaryMap.set(row.id, mapPostSummary(row, imageMap.get(row.id) || []))

  return summaryMap
}

async function getRepostTarget(postId: string): Promise<RepostTargetRow> {
  const result = await query(
    `SELECT id, city, original_post_id, post_type
     FROM community_posts
     WHERE id = $1 AND deleted_at IS NULL`,
    [postId],
  )

  if (result.rows.length === 0) throw httpError(404, '帖子不存在或已删除')

  return {
    city: result.rows[0].city,
    id: result.rows[0].id,
    original_post_id: result.rows[0].original_post_id,
    post_type: result.rows[0].post_type as CommunityPostType,
  }
}

async function hydratePosts(rows: CommunityPostRow[], viewerId?: string): Promise<CommunityPost[]> {
  const postIds = rows.map((row) => row.id)
  const imageMap = await getImagesByPostIds(postIds)
  const originalIds = [
    ...new Set(rows.map((row) => row.original_post_id).filter((id): id is string => Boolean(id))),
  ]
  const originalMap = await getOriginalSummaryMap(originalIds, viewerId)

  return rows.map((row) =>
    mapPost(
      row,
      imageMap.get(row.id) || [],
      row.original_post_id ? originalMap.get(row.original_post_id) || null : null,
    ),
  )
}

/** 插入帖子（在事务内使用） */
async function insertPost(
  client: PoolClient,
  authorId: string,
  input: CreateCommunityPostInput & { originalPostId?: null | string; postType: CommunityPostType; },
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const id = nanoid(12)
  const itinerarySnapshot =
    input.itinerarySnapshot === undefined || input.itinerarySnapshot === null
      ? null
      : JSON.stringify(input.itinerarySnapshot)

  await client.query(
    `INSERT INTO community_posts (id, author_id, city, content, itinerary_snapshot, original_post_id, post_type, title)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
    [
      id,
      authorId,
      input.city?.trim() || '',
      input.content?.trim() || '',
      itinerarySnapshot,
      input.originalPostId || null,
      input.postType,
      input.title?.trim() || '',
    ],
  )

  const images = input.images || []
  for (const [idx, image] of images.entries()) {
    await client.query(
      `INSERT INTO community_post_images (id, post_id, url, storage_key, alt_text, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nanoid(12), id, image.url, image.storageKey, image.altText?.trim() || '', idx],
    )
  }

  return id
}

function mapCommentRow(row: CommunityCommentRow): CommunityComment {
  return {
    author: {
      id: row.author_id,
      username: row.author_username,
    },
    content: row.content,
    createdAt: toIsoString(row.created_at),
    id: row.id,
    postId: row.post_id,
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapImageRow(row: CommunityImageRow): CommunityImage {
  return {
    altText: row.alt_text,
    createdAt: toIsoString(row.created_at),
    id: row.id,
    sortOrder: row.sort_order,
    storageKey: row.storage_key,
    url: row.url,
  }
}

function mapPost(
  row: CommunityPostRow,
  images: CommunityImage[],
  originalPost: CommunityPostSummary | null,
): CommunityPost {
  return {
    ...mapPostSummary(row, images),
    originalPost,
  }
}

function mapPostSummary(row: CommunityPostRow, images: CommunityImage[]): CommunityPostSummary {
  return {
    author: {
      id: row.author_id,
      username: row.author_username,
    },
    city: row.city,
    commentCount: toCount(row.comment_count),
    content: row.content,
    createdAt: toIsoString(row.created_at),
    id: row.id,
    images,
    itinerarySnapshot: row.itinerary_snapshot ?? null,
    likeCount: toCount(row.like_count),
    likedByMe: Boolean(row.liked_by_me),
    postType: row.post_type,
    repostCount: toCount(row.repost_count),
    title: row.title,
    updatedAt: toIsoString(row.updated_at),
  }
}

/** 将数据库计数字段统一转换为 number */
function toCount(value: null | number | string | undefined): number {
  return Number(value || 0)
}

/** 将数据库时间统一转换为 API 友好的 ISO 字符串 */
function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}
