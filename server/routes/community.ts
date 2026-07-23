/**
 * 社区路由
 * 提供帖子浏览、发布、图片上传、点赞、评论和转发接口。
 */
import type { Request, Response } from 'express'
import type { CommunityImageInput, CreateCommunityPostInput } from '../services/community.js'
import { Buffer } from 'node:buffer'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { Router } from 'express'
import multer from 'multer'
import { nanoid } from 'nanoid'
import { getOptionalAuthForRequest, requireAuth, requireAuthForRequest } from '../middleware/auth.js'
import { createRateLimit } from '../middleware/rateLimit.js'
import {
  createCommunityComment,
  createCommunityPost,
  deleteCommunityComment,
  deleteCommunityPost,
  getCommunityPostById,
  likeCommunityPost,
  listCommunityComments,
  listCommunityPosts,
  repostCommunityPost,
  unlikeCommunityPost,
} from '../services/community.js'
import { asyncHandler, httpError } from '../utils/http.js'
import { ensureArray, readPositiveInteger, readRequiredString } from '../utils/validation.js'

const router: ReturnType<typeof Router> = Router()

// ========== 常量与限流 ==========

const MAX_POST_CONTENT_LENGTH = 2000
const MAX_POST_TITLE_LENGTH = 80
const MAX_CITY_LENGTH = 50
const MAX_COMMENT_LENGTH = 500
const MAX_REPOST_CONTENT_LENGTH = 500
const MAX_IMAGES_PER_POST = 9
const MAX_ITINERARY_SNAPSHOT_SIZE = 100 * 1024
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const UPLOAD_ROOT = path.resolve(import.meta.dirname!, '../data/uploads/community')
const PUBLIC_UPLOAD_PREFIX = '/uploads/community'

const readLimiter = createRateLimit({ name: 'community:read', windowMs: 60_000, maxRequests: 60, message: '社区浏览过于频繁，请稍后再试' })
const postLimiter = createRateLimit({ name: 'community:post', windowMs: 60_000, maxRequests: 5, message: '发帖过于频繁，请稍后再试' })
const uploadLimiter = createRateLimit({ name: 'community:upload', windowMs: 60 * 60_000, maxRequests: 30, message: '图片上传过于频繁，请稍后再试' })
const likeLimiter = createRateLimit({ name: 'community:like', windowMs: 60_000, maxRequests: 60, message: '点赞操作过于频繁，请稍后再试' })
const commentLimiter = createRateLimit({ name: 'community:comment', windowMs: 60_000, maxRequests: 20, message: '评论过于频繁，请稍后再试' })
const repostLimiter = createRateLimit({ name: 'community:repost', windowMs: 60_000, maxRequests: 10, message: '转发过于频繁，请稍后再试' })

const allowedMimeTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

// ========== 上传配置 ==========

function currentUploadFolder() {
  const now = new Date()
  const year = String(now.getFullYear())
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const folder = path.join(UPLOAD_ROOT, year, month)
  mkdirSync(folder, { recursive: true })
  return { folder, year, month }
}

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    callback(null, currentUploadFolder().folder)
  },
  filename(_req, file, callback) {
    const ext = allowedMimeTypes.get(file.mimetype)
    if (!ext) {
      callback(httpError(400, '仅支持 JPG、PNG 或 WebP 图片'), '')
      return
    }
    callback(null, `${nanoid(16)}.${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGES_PER_POST },
  fileFilter(_req, file, callback) {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(httpError(400, '仅支持 JPG、PNG 或 WebP 图片'))
      return
    }
    callback(null, true)
  },
})

// ========== 参数读取与校验 ==========

function readOptionalString(value: unknown, fieldName: string, max: number): string {
  if (value === undefined || value === null)
    return ''
  if (typeof value !== 'string')
    throw httpError(400, `${fieldName}必须是文本`)
  const trimmed = value.trim()
  if (trimmed.length > max)
    throw httpError(400, `${fieldName}不能超过 ${max} 个字符`)
  return trimmed
}

function readBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}

function readIdParam(req: Request, name: string): string {
  const value = (req.params as Record<string, string | undefined>)[name]
  return readRequiredString(value, name, { min: 1, max: 100 })
}

function validateItinerarySnapshot(value: unknown): unknown | undefined {
  if (value === undefined || value === null)
    return undefined

  const size = Buffer.byteLength(JSON.stringify(value), 'utf8')
  if (size > MAX_ITINERARY_SNAPSHOT_SIZE)
    throw httpError(400, '行程快照不能超过 100KB')

  if (typeof value !== 'object')
    throw httpError(400, '行程快照格式无效')

  const snapshot = value as Record<string, unknown>
  if (snapshot.city !== undefined)
    readOptionalString(snapshot.city, '行程城市', MAX_CITY_LENGTH)
  if (snapshot.days !== undefined)
    readPositiveInteger(snapshot.days, '行程天数', { min: 1, max: 30 })
  if (snapshot.itinerary !== undefined && !Array.isArray(snapshot.itinerary))
    throw httpError(400, '行程安排必须是数组')
  if (Array.isArray(snapshot.itinerary) && snapshot.itinerary.length > 30)
    throw httpError(400, '行程安排最多支持 30 天')

  return value
}

function validateImages(value: unknown): CommunityImageInput[] {
  const rawImages = ensureArray(value, '图片', { max: MAX_IMAGES_PER_POST })
  return rawImages.map((item, index) => {
    if (!item || typeof item !== 'object')
      throw httpError(400, `第 ${index + 1} 张图片格式无效`)

    const image = item as Record<string, unknown>
    const url = readRequiredString(image.url, '图片地址', { min: 1, max: 300 })
    const storageKey = readRequiredString(image.storageKey, '图片存储键', { min: 1, max: 300 })
    if (!url.startsWith(PUBLIC_UPLOAD_PREFIX) || !storageKey.startsWith('community/'))
      throw httpError(400, '图片必须来自社区上传接口')

    return {
      url,
      storageKey,
      altText: readOptionalString(image.altText, '图片描述', 120),
    }
  })
}

function validatePostPayload(payload: unknown): CreateCommunityPostInput {
  if (!payload || typeof payload !== 'object')
    throw httpError(400, '缺少帖子数据')

  const p = payload as Record<string, unknown>
  const title = readOptionalString(p.title, '标题', MAX_POST_TITLE_LENGTH)
  const content = readOptionalString(p.content, '正文', MAX_POST_CONTENT_LENGTH)
  const city = readOptionalString(p.city, '城市', MAX_CITY_LENGTH)
  const images = validateImages(p.images)
  const itinerarySnapshot = validateItinerarySnapshot(p.itinerarySnapshot)

  if (!content && images.length === 0 && !itinerarySnapshot)
    throw httpError(400, '正文、图片和行程快照至少需要提供一项')

  return { title, content, city, images, itinerarySnapshot }
}

function readPagination(query: Record<string, unknown>, maxPageSize: number, defaultPageSize: number) {
  return {
    page: readPositiveInteger(query.page || 1, '页码', { min: 1, max: 10_000 }),
    pageSize: readPositiveInteger(query.pageSize || defaultPageSize, '每页数量', { min: 1, max: maxPageSize }),
  }
}

function handleUploadErrors(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.array('files', MAX_IMAGES_PER_POST)(req, res, (err: unknown) => {
      if (!err) {
        resolve()
        return
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          reject(httpError(413, '单张图片不能超过 5MB'))
          return
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          reject(httpError(400, '每次最多上传 9 张图片'))
          return
        }
      }
      reject(err)
    })
  })
}

// ========== 路由定义 ==========

/** 获取帖子列表，公开可访问，登录后返回 likedByMe */
router.get('/posts', readLimiter, asyncHandler(async (req: Request, res: Response) => {
  const viewer = getOptionalAuthForRequest(req)
  const query = req.query as Record<string, unknown>
  const { page, pageSize } = readPagination(query, 30, 10)
  const data = await listCommunityPosts({
    page,
    pageSize,
    city: readOptionalString(query.city, '城市', MAX_CITY_LENGTH),
    withItinerary: readBoolean(query.withItinerary),
    authorId: readOptionalString(query.authorId, '作者', 100),
  }, viewer?.id)
  res.json({ success: true, data, message: 'ok' })
}))

/** 创建帖子 */
router.post('/posts', postLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const post = await createCommunityPost(user.id, validatePostPayload(req.body))
  res.json({ success: true, data: post, message: '已发布到社区' })
}))

/** 获取帖子详情 */
router.get('/posts/:id', readLimiter, asyncHandler(async (req: Request, res: Response) => {
  const viewer = getOptionalAuthForRequest(req)
  const post = await getCommunityPostById(readIdParam(req, 'id'), viewer?.id)
  if (!post)
    throw httpError(404, '帖子不存在或已删除')
  res.json({ success: true, data: post, message: 'ok' })
}))

/** 删除自己的帖子 */
router.delete('/posts/:id', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  await deleteCommunityPost(readIdParam(req, 'id'), user.id)
  res.json({ success: true, message: '帖子已删除' })
}))

/** 点赞帖子 */
router.post('/posts/:id/like', likeLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const data = await likeCommunityPost(readIdParam(req, 'id'), user.id)
  res.json({ success: true, data, message: '已点赞' })
}))

/** 取消点赞 */
router.delete('/posts/:id/like', likeLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const data = await unlikeCommunityPost(readIdParam(req, 'id'), user.id)
  res.json({ success: true, data, message: '已取消点赞' })
}))

/** 获取评论列表 */
router.get('/posts/:id/comments', readLimiter, asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as Record<string, unknown>
  const { page, pageSize } = readPagination(query, 50, 20)
  const data = await listCommunityComments(readIdParam(req, 'id'), page, pageSize)
  res.json({ success: true, data, message: 'ok' })
}))

/** 创建评论 */
router.post('/posts/:id/comments', commentLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const content = readRequiredString(req.body.content, '评论内容', { min: 1, max: MAX_COMMENT_LENGTH })
  const data = await createCommunityComment(readIdParam(req, 'id'), user.id, content)
  res.json({ success: true, data, message: '评论已发布' })
}))

/** 删除自己的评论 */
router.delete('/comments/:commentId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  await deleteCommunityComment(readIdParam(req, 'commentId'), user.id)
  res.json({ success: true, message: '评论已删除' })
}))

/** 转发帖子 */
router.post('/posts/:id/repost', repostLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const content = readOptionalString(req.body?.content, '转发附言', MAX_REPOST_CONTENT_LENGTH)
  const data = await repostCommunityPost(readIdParam(req, 'id'), user.id, content)
  res.json({ success: true, data, message: '已转发到社区' })
}))

/** 上传社区图片 */
router.post('/uploads/images', uploadLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  await handleUploadErrors(req, res)
  const files = (req.files || []) as Express.Multer.File[]
  if (files.length === 0)
    throw httpError(400, '请选择要上传的图片')

  const images = files.map((file) => {
    const relativePath = path.relative(UPLOAD_ROOT, file.path).split(path.sep).join('/')
    return {
      url: `${PUBLIC_UPLOAD_PREFIX}/${relativePath}`,
      storageKey: `community/${relativePath}`,
      altText: file.originalname ? `${file.originalname} 图片` : '旅行分享图片',
    }
  })

  res.json({ success: true, data: { images }, message: '上传成功' })
}))

export default router
