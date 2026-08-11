/**
 * 社区领域服务
 * 负责帖子、图片、点赞、评论和转发的 PostgreSQL 数据访问。
 */
import { and, asc, count, eq, sql } from 'drizzle-orm'

import {
  communityPostComments,
  communityPostImages,
  communityPostLikes,
  communityPosts,
  users,
} from '@/db/schema'

import { db, typedQuery } from '../db'
import { httpError } from '../utils/http'

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

/** 构建帖子列表的基础 SQL（含 LATERAL JOIN 聚合计数和当前用户点赞状态） */
function basePostSelect(viewerId: string) {
  return sql`
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
        WHERE viewer_like.post_id = p.id AND viewer_like.user_id = ${viewerId}
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
  for (const postId of postIds) imageMap.set(postId, [])

  if (postIds.length === 0) return imageMap

  const rows = await db
    .select()
    .from(communityPostImages)
    .where(sql`${communityPostImages.postId} = ANY(${postIds}::text[])`)
    .orderBy(
      communityPostImages.postId,
      communityPostImages.sortOrder,
      communityPostImages.createdAt,
    )

  for (const row of rows) {
    const images = imageMap.get(row.postId) || []
    images.push(
      mapImageRow({
        id: row.id,
        post_id: row.postId,
        url: row.url,
        storage_key: row.storageKey,
        alt_text: row.altText,
        sort_order: row.sortOrder,
        created_at: row.createdAt,
      }),
    )
    imageMap.set(row.postId, images)
  }

  return imageMap
}

async function getOriginalSummaryMap(
  originalIds: string[],
  viewerId?: string,
): Promise<Map<string, CommunityPostSummary>> {
  const summaryMap = new Map<string, CommunityPostSummary>()
  if (originalIds.length === 0) return summaryMap

  const viewerIdValue = viewerId || ''
  const rows = await db.execute(
    sql`${basePostSelect(viewerIdValue)} WHERE p.deleted_at IS NULL AND p.id = ANY(${originalIds}::text[])`,
  )

  const postRows = typedQuery<CommunityPostRow>(rows.rows)
  const imageMap = await getImagesByPostIds(postRows.map((row) => row.id))
  for (const row of postRows)
    summaryMap.set(row.id, mapPostSummary(row, imageMap.get(row.id) || []))

  return summaryMap
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

async function ensurePostExists(postId: string): Promise<void> {
  const result = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(and(eq(communityPosts.id, postId), sql`${communityPosts.deletedAt} IS NULL`))

  if (result.length === 0) throw httpError(404, '帖子不存在或已删除')
}

async function getLikeCount(postId: string): Promise<number> {
  const result = await db
    .select({ cnt: count() })
    .from(communityPostLikes)
    .where(eq(communityPostLikes.postId, postId))

  return result[0]?.cnt ?? 0
}

async function getCommentCount(postId: string): Promise<number> {
  const result = await db
    .select({ cnt: count() })
    .from(communityPostComments)
    .where(
      and(
        eq(communityPostComments.postId, postId),
        sql`${communityPostComments.deletedAt} IS NULL`,
      ),
    )

  return result[0]?.cnt ?? 0
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
  const conditions = [sql`${communityPosts.deletedAt} IS NULL`]

  if (filters.city) {
    conditions.push(eq(communityPosts.city, filters.city))
  }

  if (filters.withItinerary) {
    conditions.push(sql`${communityPosts.itinerarySnapshot} IS NOT NULL`)
  }

  if (filters.authorId) {
    conditions.push(eq(communityPosts.authorId, filters.authorId))
  }

  const whereClause =
    conditions.length > 0
      ? sql.join(
          conditions.map((c) => c),
          sql` AND `,
        )
      : sql`TRUE`

  const [countResult, dataResult] = await Promise.all([
    db.select({ cnt: count() }).from(communityPosts).where(whereClause),
    db.execute(
      sql`${basePostSelect(viewerIdValue)} WHERE ${whereClause} ORDER BY p.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`,
    ),
  ])

  return {
    items: await hydratePosts(typedQuery<CommunityPostRow>(dataResult.rows), viewerId),
    total: countResult[0]?.cnt ?? 0,
    page,
    pageSize,
  }
}

/** 查询帖子详情 */
export async function getCommunityPostById(
  id: string,
  viewerId?: string,
): Promise<CommunityPost | null> {
  const viewerIdValue = viewerId || ''
  const result = await db.execute(
    sql`${basePostSelect(viewerIdValue)} WHERE p.deleted_at IS NULL AND p.id = ${id}`,
  )

  if (result.rows.length === 0) return null

  const [post] = await hydratePosts(typedQuery<CommunityPostRow>(result.rows), viewerId)
  return post
}

/** 插入帖子（在事务内使用） */
async function insertPost(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  authorId: string,
  input: CreateCommunityPostInput & { postType: CommunityPostType; originalPostId?: string | null },
): Promise<string> {
  const { nanoid } = await import('nanoid')
  const id = nanoid(12)
  const itinerarySnapshot =
    input.itinerarySnapshot === undefined || input.itinerarySnapshot === null
      ? null
      : JSON.stringify(input.itinerarySnapshot)

  await tx.insert(communityPosts).values({
    id,
    authorId,
    postType: input.postType,
    originalPostId: input.originalPostId || null,
    title: input.title?.trim() || '',
    content: input.content?.trim() || '',
    city: input.city?.trim() || '',
    itinerarySnapshot: itinerarySnapshot ? sql`${itinerarySnapshot}::jsonb` : null,
  })

  const images = input.images || []
  for (const [index, image] of images.entries()) {
    await tx.insert(communityPostImages).values({
      id: nanoid(12),
      postId: id,
      url: image.url,
      storageKey: image.storageKey,
      altText: image.altText?.trim() || '',
      sortOrder: index,
    })
  }

  return id
}

/** 创建社区原帖 */
export async function createCommunityPost(
  authorId: string,
  input: CreateCommunityPostInput,
): Promise<CommunityPost> {
  const id = await db.transaction(async (tx) => {
    return insertPost(tx, authorId, { ...input, postType: 'original', originalPostId: null })
  })

  const post = await getCommunityPostById(id, authorId)
  if (!post) throw httpError(500, '帖子创建后读取失败')
  return post
}

/** 软删除自己的帖子 */
export async function deleteCommunityPost(postId: string, authorId: string): Promise<void> {
  const result = await db
    .select({ authorId: communityPosts.authorId })
    .from(communityPosts)
    .where(and(eq(communityPosts.id, postId), sql`${communityPosts.deletedAt} IS NULL`))

  if (result.length === 0) throw httpError(404, '帖子不存在或已删除')
  if (result[0].authorId !== authorId) throw httpError(403, '只能删除自己的帖子')

  await db
    .update(communityPosts)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(communityPosts.id, postId))
}

/** 点赞帖子，重复点赞保持幂等 */
export async function likeCommunityPost(
  postId: string,
  userId: string,
): Promise<LikeCommunityPostResult> {
  await ensurePostExists(postId)
  await db.insert(communityPostLikes).values({ postId, userId }).onConflictDoNothing()

  return { likedByMe: true, likeCount: await getLikeCount(postId) }
}

/** 取消点赞 */
export async function unlikeCommunityPost(
  postId: string,
  userId: string,
): Promise<LikeCommunityPostResult> {
  await ensurePostExists(postId)
  await db
    .delete(communityPostLikes)
    .where(and(eq(communityPostLikes.postId, postId), eq(communityPostLikes.userId, userId)))
  return { likedByMe: false, likeCount: await getLikeCount(postId) }
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
    db
      .select({
        id: communityPostComments.id,
        postId: communityPostComments.postId,
        authorId: communityPostComments.authorId,
        authorUsername: users.username,
        content: communityPostComments.content,
        createdAt: communityPostComments.createdAt,
        updatedAt: communityPostComments.updatedAt,
      })
      .from(communityPostComments)
      .innerJoin(users, eq(users.id, communityPostComments.authorId))
      .where(
        and(
          eq(communityPostComments.postId, postId),
          sql`${communityPostComments.deletedAt} IS NULL`,
        ),
      )
      .orderBy(asc(communityPostComments.createdAt))
      .limit(normalizedPageSize)
      .offset(offset),
    db
      .select({ cnt: count() })
      .from(communityPostComments)
      .where(
        and(
          eq(communityPostComments.postId, postId),
          sql`${communityPostComments.deletedAt} IS NULL`,
        ),
      ),
  ])

  return {
    items: dataResult.map((row) =>
      mapCommentRow({
        id: row.id,
        post_id: row.postId,
        author_id: row.authorId,
        author_username: row.authorUsername,
        content: row.content,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
      }),
    ),
    total: countResult[0]?.cnt ?? 0,
    page: normalizedPage,
    pageSize: normalizedPageSize,
  }
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

  const [inserted] = await db
    .insert(communityPostComments)
    .values({
      id,
      postId,
      authorId,
      content,
    })
    .returning()

  const userResult = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, authorId))
  const authorUsername = userResult[0]?.username || ''

  return {
    comment: mapCommentRow({
      id: inserted.id,
      post_id: inserted.postId,
      author_id: inserted.authorId,
      author_username: authorUsername,
      content: inserted.content,
      created_at: inserted.createdAt,
      updated_at: inserted.updatedAt,
    }),
    commentCount: await getCommentCount(postId),
  }
}

/** 软删除自己的评论 */
export async function deleteCommunityComment(commentId: string, authorId: string): Promise<void> {
  const result = await db
    .select({ authorId: communityPostComments.authorId })
    .from(communityPostComments)
    .where(
      and(eq(communityPostComments.id, commentId), sql`${communityPostComments.deletedAt} IS NULL`),
    )

  if (result.length === 0) throw httpError(404, '评论不存在或已删除')
  if (result[0].authorId !== authorId) throw httpError(403, '只能删除自己的评论')

  await db
    .update(communityPostComments)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(communityPostComments.id, commentId))
}

async function getRepostTarget(postId: string): Promise<RepostTargetRow> {
  const result = await db
    .select({
      id: communityPosts.id,
      postType: communityPosts.postType,
      originalPostId: communityPosts.originalPostId,
      city: communityPosts.city,
    })
    .from(communityPosts)
    .where(and(eq(communityPosts.id, postId), sql`${communityPosts.deletedAt} IS NULL`))

  if (result.length === 0) throw httpError(404, '帖子不存在或已删除')

  return {
    id: result[0].id,
    post_type: result[0].postType as CommunityPostType,
    original_post_id: result[0].originalPostId,
    city: result[0].city,
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

  const newPostId = await db.transaction(async (tx) => {
    return insertPost(tx, authorId, {
      postType: 'repost',
      originalPostId,
      content,
      city: target.city,
    })
  })

  const post = await getCommunityPostById(newPostId, authorId)
  if (!post) throw httpError(500, '转发创建后读取失败')
  return post
}
