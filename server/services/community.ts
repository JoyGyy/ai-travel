/**
 * 社区领域服务
 * 负责帖子、图片、点赞、评论和转发的 PostgreSQL 数据访问。
 */
import type { PoolClient } from 'pg'

import { nanoid } from 'nanoid'
import { getClient, query } from '../db/index.js'
import { httpError } from '../utils/http.js'

export type CommunityPostType = 'original' | 'repost'

export interface CommunityAuthor {
  id: string
  username: string
}

export interface CommunityImageInput {
  url: string
  storageKey: string
  altText?: string
}

export interface CommunityImage {
  id: string
  url: string
  storageKey: string
  altText: string
  sortOrder: number
  createdAt: string
}

export interface CommunityPostSummary {
  id: string
  postType: CommunityPostType
  author: CommunityAuthor
  title: string
  content: string
  city: string
  itinerarySnapshot: unknown | null
  images: CommunityImage[]
  likeCount: number
  commentCount: number
  repostCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityPost extends CommunityPostSummary {
  originalPost: CommunityPostSummary | null
}

export interface CommunityComment {
  id: string
  postId: string
  author: CommunityAuthor
  content: string
  createdAt: string
  updatedAt: string
}

export interface CreateCommunityPostInput {
  title?: string
  content?: string
  city?: string
  itinerarySnapshot?: unknown
  images?: CommunityImageInput[]
}

export interface CommunityListFilters {
  page: number
  pageSize: number
  city: string
  withItinerary: boolean
  authorId: string
}

export interface CommunityPostListData {
  items: CommunityPost[]
  total: number
  page: number
  pageSize: number
}

export interface CommunityCommentListData {
  items: CommunityComment[]
  total: number
  page: number
  pageSize: number
}

export interface LikeCommunityPostResult {
  likedByMe: boolean
  likeCount: number
}

export interface CreateCommunityCommentResult {
  comment: CommunityComment
  commentCount: number
}

interface CommunityPostRow {
  id: string
  author_id: string
  author_username: string
  post_type: CommunityPostType
  original_post_id: string | null
  title: string
  content: string
  city: string
  itinerary_snapshot: unknown | null
  like_count: string | number
  comment_count: string | number
  repost_count: string | number
  liked_by_me: boolean
  created_at: Date | string
  updated_at: Date | string
}

interface CommunityImageRow {
  id: string
  post_id: string
  url: string
  storage_key: string
  alt_text: string
  sort_order: number
  created_at: Date | string
}

interface CommunityCommentRow {
  id: string
  post_id: string
  author_id: string
  author_username: string
  content: string
  created_at: Date | string
  updated_at: Date | string
}

interface RepostTargetRow {
  id: string
  post_type: CommunityPostType
  original_post_id: string | null
  city: string
}

/** 将数据库时间统一转换为 API 友好的 ISO 字符串 */
function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value
}

/** 将数据库计数字段统一转换为 number */
function toCount(value: string | number | null | undefined): number {
  return Number(value || 0)
}

function mapImageRow(row: CommunityImageRow): CommunityImage {
  return {
    id: row.id,
    url: row.url,
    storageKey: row.storage_key,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: toIsoString(row.created_at),
  }
}

function mapCommentRow(row: CommunityCommentRow): CommunityComment {
  return {
    id: row.id,
    postId: row.post_id,
    author: {
      id: row.author_id,
      username: row.author_username,
    },
    content: row.content,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapPostSummary(row: CommunityPostRow, images: CommunityImage[]): CommunityPostSummary {
  return {
    id: row.id,
    postType: row.post_type,
    author: {
      id: row.author_id,
      username: row.author_username,
    },
    title: row.title,
    content: row.content,
    city: row.city,
    itinerarySnapshot: row.itinerary_snapshot ?? null,
    images,
    likeCount: toCount(row.like_count),
    commentCount: toCount(row.comment_count),
    repostCount: toCount(row.repost_count),
    likedByMe: Boolean(row.liked_by_me),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapPost(row: CommunityPostRow, images: CommunityImage[], originalPost: CommunityPostSummary | null): CommunityPost {
  return {
    ...mapPostSummary(row, images),
    originalPost,
  }
}

function basePostSelect(viewerIdParam: number): string {
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
        WHERE viewer_like.post_id = p.id AND viewer_like.user_id = $${viewerIdParam}
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

async function getImagesByPostIds(postIds: string[]): Promise<Map<string, CommunityImage[]>> {
  const imageMap = new Map<string, CommunityImage[]>()
  for (const postId of postIds)
    imageMap.set(postId, [])

  if (postIds.length === 0)
    return imageMap

  const result = await query(
    `SELECT id, post_id, url, storage_key, alt_text, sort_order, created_at
     FROM community_post_images
     WHERE post_id = ANY($1::text[])
     ORDER BY post_id, sort_order, created_at`,
    [postIds],
  )

  for (const row of result.rows as CommunityImageRow[]) {
    const images = imageMap.get(row.post_id) || []
    images.push(mapImageRow(row))
    imageMap.set(row.post_id, images)
  }

  return imageMap
}

async function getOriginalSummaryMap(originalIds: string[], viewerId?: string): Promise<Map<string, CommunityPostSummary>> {
  const summaryMap = new Map<string, CommunityPostSummary>()
  if (originalIds.length === 0)
    return summaryMap

  const viewerIdValue = viewerId || ''
  const result = await query(
    `${basePostSelect(1)}
     WHERE p.deleted_at IS NULL AND p.id = ANY($2::text[])`,
    [viewerIdValue, originalIds],
  )

  const rows = result.rows as CommunityPostRow[]
  const imageMap = await getImagesByPostIds(rows.map(row => row.id))
  for (const row of rows)
    summaryMap.set(row.id, mapPostSummary(row, imageMap.get(row.id) || []))

  return summaryMap
}

async function hydratePosts(rows: CommunityPostRow[], viewerId?: string): Promise<CommunityPost[]> {
  const postIds = rows.map(row => row.id)
  const imageMap = await getImagesByPostIds(postIds)
  const originalIds = [...new Set(rows.map(row => row.original_post_id).filter((id): id is string => Boolean(id)))]
  const originalMap = await getOriginalSummaryMap(originalIds, viewerId)

  return rows.map(row => mapPost(row, imageMap.get(row.id) || [], row.original_post_id ? originalMap.get(row.original_post_id) || null : null))
}

async function ensurePostExists(postId: string): Promise<void> {
  const result = await query('SELECT id FROM community_posts WHERE id = $1 AND deleted_at IS NULL', [postId])
  if (result.rows.length === 0)
    throw httpError(404, '帖子不存在或已删除')
}

async function getLikeCount(postId: string): Promise<number> {
  const result = await query('SELECT COUNT(*)::int AS count FROM community_post_likes WHERE post_id = $1', [postId])
  return toCount(result.rows[0]?.count)
}

async function getCommentCount(postId: string): Promise<number> {
  const result = await query('SELECT COUNT(*)::int AS count FROM community_post_comments WHERE post_id = $1 AND deleted_at IS NULL', [postId])
  return toCount(result.rows[0]?.count)
}

/** 查询社区帖子列表 */
export async function listCommunityPosts(filters: CommunityListFilters, viewerId?: string): Promise<CommunityPostListData> {
  const page = Math.max(1, filters.page || 1)
  const pageSize = Math.min(30, Math.max(1, filters.pageSize || 10))
  const offset = (page - 1) * pageSize
  const viewerIdValue = viewerId || ''

  const conditions = ['p.deleted_at IS NULL']
  const filterParams: unknown[] = []
  let filterParamIndex = 1

  if (filters.city) {
    conditions.push(`p.city = $${filterParamIndex++}`)
    filterParams.push(filters.city)
  }

  if (filters.withItinerary) {
    conditions.push('p.itinerary_snapshot IS NOT NULL')
  }

  if (filters.authorId) {
    conditions.push(`p.author_id = $${filterParamIndex++}`)
    filterParams.push(filters.authorId)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  const countResult = await query(
    `SELECT COUNT(*)::int AS count FROM community_posts p ${where}`,
    filterParams,
  )

  const dataParams = [viewerIdValue, ...filterParams]
  const dataWhere = where.replace(/\$(\d+)/g, (_, index: string) => `$${Number(index) + 1}`)
  const dataParamIndex = dataParams.length + 1
  const dataResult = await query(
    `${basePostSelect(1)}
     ${dataWhere}
     ORDER BY p.created_at DESC
     LIMIT $${dataParamIndex} OFFSET $${dataParamIndex + 1}`,
    [...dataParams, pageSize, offset],
  )

  return {
    items: await hydratePosts(dataResult.rows as CommunityPostRow[], viewerId),
    total: toCount(countResult.rows[0]?.count),
    page,
    pageSize,
  }
}

/** 查询帖子详情 */
export async function getCommunityPostById(id: string, viewerId?: string): Promise<CommunityPost | null> {
  const result = await query(
    `${basePostSelect(1)}
     WHERE p.deleted_at IS NULL AND p.id = $2`,
    [viewerId || '', id],
  )

  const rows = result.rows as CommunityPostRow[]
  if (rows.length === 0)
    return null

  const [post] = await hydratePosts(rows, viewerId)
  return post
}

async function insertPost(client: PoolClient, authorId: string, input: CreateCommunityPostInput & { postType: CommunityPostType, originalPostId?: string | null }): Promise<string> {
  const id = nanoid(12)
  const itinerarySnapshot = input.itinerarySnapshot === undefined || input.itinerarySnapshot === null
    ? null
    : JSON.stringify(input.itinerarySnapshot)

  await client.query(
    `INSERT INTO community_posts (
      id, author_id, post_type, original_post_id, title, content, city, itinerary_snapshot
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [
      id,
      authorId,
      input.postType,
      input.originalPostId || null,
      input.title?.trim() || '',
      input.content?.trim() || '',
      input.city?.trim() || '',
      itinerarySnapshot,
    ],
  )

  const images = input.images || []
  for (const [index, image] of images.entries()) {
    await client.query(
      `INSERT INTO community_post_images (id, post_id, url, storage_key, alt_text, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [nanoid(12), id, image.url, image.storageKey, image.altText?.trim() || '', index],
    )
  }

  return id
}

/** 创建社区原帖 */
export async function createCommunityPost(authorId: string, input: CreateCommunityPostInput): Promise<CommunityPost> {
  const client = await getClient()
  let id = ''
  try {
    await client.query('BEGIN')
    id = await insertPost(client, authorId, { ...input, postType: 'original', originalPostId: null })
    await client.query('COMMIT')
  }
  catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
  finally {
    client.release()
  }

  const post = await getCommunityPostById(id, authorId)
  if (!post)
    throw httpError(500, '帖子创建后读取失败')
  return post
}

/** 软删除自己的帖子 */
export async function deleteCommunityPost(postId: string, authorId: string): Promise<void> {
  const result = await query(
    'SELECT author_id FROM community_posts WHERE id = $1 AND deleted_at IS NULL',
    [postId],
  )

  if (result.rows.length === 0)
    throw httpError(404, '帖子不存在或已删除')
  if (result.rows[0].author_id !== authorId)
    throw httpError(403, '只能删除自己的帖子')

  await query('UPDATE community_posts SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [postId])
}

/** 点赞帖子，重复点赞保持幂等 */
export async function likeCommunityPost(postId: string, userId: string): Promise<LikeCommunityPostResult> {
  await ensurePostExists(postId)
  await query(
    `INSERT INTO community_post_likes (post_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [postId, userId],
  )

  return { likedByMe: true, likeCount: await getLikeCount(postId) }
}

/** 取消点赞 */
export async function unlikeCommunityPost(postId: string, userId: string): Promise<LikeCommunityPostResult> {
  await ensurePostExists(postId)
  await query('DELETE FROM community_post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId])
  return { likedByMe: false, likeCount: await getLikeCount(postId) }
}

/** 查询帖子评论列表 */
export async function listCommunityComments(postId: string, page = 1, pageSize = 20): Promise<CommunityCommentListData> {
  await ensurePostExists(postId)
  const normalizedPage = Math.max(1, page || 1)
  const normalizedPageSize = Math.min(50, Math.max(1, pageSize || 20))
  const offset = (normalizedPage - 1) * normalizedPageSize

  const [dataResult, countResult] = await Promise.all([
    query(
      `SELECT c.id, c.post_id, c.author_id, u.username AS author_username, c.content, c.created_at, c.updated_at
       FROM community_post_comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC
       LIMIT $2 OFFSET $3`,
      [postId, normalizedPageSize, offset],
    ),
    query('SELECT COUNT(*)::int AS count FROM community_post_comments WHERE post_id = $1 AND deleted_at IS NULL', [postId]),
  ])

  return {
    items: (dataResult.rows as CommunityCommentRow[]).map(mapCommentRow),
    total: toCount(countResult.rows[0]?.count),
    page: normalizedPage,
    pageSize: normalizedPageSize,
  }
}

/** 创建评论 */
export async function createCommunityComment(postId: string, authorId: string, content: string): Promise<CreateCommunityCommentResult> {
  await ensurePostExists(postId)
  const id = nanoid(12)
  const result = await query(
    `INSERT INTO community_post_comments (id, post_id, author_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, post_id, author_id, content, created_at, updated_at`,
    [id, postId, authorId, content],
  )

  const row = result.rows[0] as Omit<CommunityCommentRow, 'author_username'>
  const userResult = await query('SELECT username FROM users WHERE id = $1', [authorId])
  const authorUsername = userResult.rows[0]?.username || ''
  return {
    comment: mapCommentRow({ ...row, author_username: authorUsername }),
    commentCount: await getCommentCount(postId),
  }
}

/** 软删除自己的评论 */
export async function deleteCommunityComment(commentId: string, authorId: string): Promise<void> {
  const result = await query(
    'SELECT author_id FROM community_post_comments WHERE id = $1 AND deleted_at IS NULL',
    [commentId],
  )

  if (result.rows.length === 0)
    throw httpError(404, '评论不存在或已删除')
  if (result.rows[0].author_id !== authorId)
    throw httpError(403, '只能删除自己的评论')

  await query('UPDATE community_post_comments SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1', [commentId])
}

async function getRepostTarget(postId: string): Promise<RepostTargetRow> {
  const result = await query(
    `SELECT id, post_type, original_post_id, city
     FROM community_posts
     WHERE id = $1 AND deleted_at IS NULL`,
    [postId],
  )

  if (result.rows.length === 0)
    throw httpError(404, '帖子不存在或已删除')

  return result.rows[0] as RepostTargetRow
}

/** 转发帖子，转发转发帖时归一到最初原帖 */
export async function repostCommunityPost(postId: string, authorId: string, content = ''): Promise<CommunityPost> {
  const target = await getRepostTarget(postId)
  const originalPostId = target.original_post_id || target.id
  await ensurePostExists(originalPostId)

  const client = await getClient()
  let newPostId = ''
  try {
    await client.query('BEGIN')
    newPostId = await insertPost(client, authorId, {
      postType: 'repost',
      originalPostId,
      content,
      city: target.city,
    })
    await client.query('COMMIT')
  }
  catch (err) {
    await client.query('ROLLBACK')
    throw err
  }
  finally {
    client.release()
  }

  const post = await getCommunityPostById(newPostId, authorId)
  if (!post)
    throw httpError(500, '转发创建后读取失败')
  return post
}
