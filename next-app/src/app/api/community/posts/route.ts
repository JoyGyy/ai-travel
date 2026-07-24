/**
 * 社区路由 — 帖子列表/创建
 * GET /api/community/posts — 获取帖子列表（公开可访问，登录后返回 likedByMe）
 * POST /api/community/posts — 创建帖子（需要登录）
 */
import { Buffer } from 'node:buffer'

import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthFromHeaders } from '@/lib/services/auth'
import type { CommunityImageInput, CreateCommunityPostInput } from '@/lib/services/community'
import {
  createCommunityPost,
  listCommunityPosts,
} from '@/lib/services/community'
import { extractCsrfToken, verifyCsrfToken } from '@/lib/utils/csrf'
import { errorResponse, httpError } from '@/lib/utils/http'

const MAX_POST_CONTENT_LENGTH = 2000
const MAX_POST_TITLE_LENGTH = 80
const MAX_CITY_LENGTH = 50
const MAX_IMAGES_PER_POST = 9
const MAX_ITINERARY_SNAPSHOT_SIZE = 100 * 1024
const PUBLIC_UPLOAD_PREFIX = '/uploads/community'

// ========== 参数读取与校验 ==========

function readOptionalString(value: unknown, fieldName: string, max: number): string {
  if (value === undefined || value === null) return ''
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

function readPositiveInteger(value: unknown, fieldName: string, options: { min?: number, max?: number } = {}): number {
  const { min = 1, max = 30 } = options
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的整数`)
  return number
}

function readRequiredString(value: unknown, fieldName: string, options: { min?: number, max?: number } = {}): string {
  const { min = 1, max = 2000 } = options
  if (typeof value !== 'string')
    throw httpError(400, `${fieldName}必须是文本`)
  const trimmed = value.trim()
  if (trimmed.length < min)
    throw httpError(400, `请输入${fieldName}`)
  if (trimmed.length > max)
    throw httpError(400, `${fieldName}不能超过 ${max} 个字符`)
  return trimmed
}

function ensureArray(value: unknown, fieldName: string, options: { max?: number } = {}): unknown[] {
  const { max = 20 } = options
  if (value === undefined) return []
  if (!Array.isArray(value))
    throw httpError(400, `${fieldName}必须是数组`)
  if (value.length > max)
    throw httpError(400, `${fieldName}最多支持 ${max} 条`)
  return value
}

function validateItinerarySnapshot(value: unknown): unknown | undefined {
  if (value === undefined || value === null) return undefined

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

// ========== 路由处理 ==========

export async function GET(req: Request) {
  try {
    // 限流
    const rateLimited = checkRateLimit(req, 'community:read', 60, 60_000)
    if (rateLimited) return rateLimited

    const viewer = getAuthFromHeaders(req.headers)
    const { searchParams } = new URL(req.url)

    const page = readPositiveInteger(searchParams.get('page') || '1', '页码', { min: 1, max: 10_000 })
    const pageSize = readPositiveInteger(searchParams.get('pageSize') || '10', '每页数量', { min: 1, max: 30 })

    const data = await listCommunityPosts({
      page,
      pageSize,
      city: readOptionalString(searchParams.get('city'), '城市', MAX_CITY_LENGTH),
      withItinerary: readBoolean(searchParams.get('withItinerary')),
      authorId: readOptionalString(searchParams.get('authorId'), '作者', 100),
    }, viewer?.id)

    return NextResponse.json({ success: true, data, message: 'ok' })
  }
  catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    // CSRF 验证
    const csrfToken = extractCsrfToken(req.headers, req.headers.get('cookie') || undefined)
    if (!csrfToken || !verifyCsrfToken(csrfToken)) {
      throw httpError(403, 'CSRF token 无效')
    }

    // 限流
    const rateLimited = checkRateLimit(req, 'community:post', 5, 60_000)
    if (rateLimited) return rateLimited

    const post = await createCommunityPost(user.id, validatePostPayload(await req.json()))

    return NextResponse.json({ success: true, data: post, message: '已发布到社区' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
