/**
 * 分享路由 — 创建行程分享
 * POST /api/travel/share
 */
import { Buffer } from 'node:buffer'

import { NextResponse } from 'next/server'

import { checkRateLimit } from '@/lib/rate-limit'
import { getAuthFromHeaders } from '@/lib/services/auth'
import { createShare } from '@/lib/services/share'
import { extractCsrfToken, verifyCsrfToken } from '@/lib/utils/csrf'
import { errorResponse, httpError } from '@/lib/utils/http'
import { readPositiveInteger, readRequiredString } from '@/lib/utils/validation'

/** 分享内容持久化上限（字节）：100KB */
const MAX_SHARE_BODY_SIZE = 100 * 1024

interface SharePayload {
  city: string
  days: number
  budget: string
  itinerary: unknown
}

function validateSharePayload(payload: unknown): SharePayload {
  if (!payload || typeof payload !== 'object')
    throw httpError(400, '缺少分享数据')

  const p = payload as Record<string, unknown>

  if (Buffer.byteLength(JSON.stringify(p), 'utf8') > MAX_SHARE_BODY_SIZE)
    throw httpError(400, '请求数据过大')

  const city = readRequiredString(p.city, '城市名称', { min: 1, max: 50 })
  const days = readPositiveInteger(p.days, '行程天数', { min: 1, max: 30 })
  const budget = readRequiredString(String(p.budget ?? ''), '预算', { min: 1, max: 50 })

  if (!p.itinerary)
    throw httpError(400, '缺少行程数据')

  return { city, days, budget, itinerary: p.itinerary }
}

export async function POST(req: Request) {
  try {
    // 认证
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
    const rateLimited = checkRateLimit(req, 'share:post', 10, 60_000)
    if (rateLimited) return rateLimited

    const payload = validateSharePayload(await req.json())
    const shareId = createShare(payload)

    return NextResponse.json({ success: true, shareId, shareUrl: `/share/${shareId}` })
  }
  catch (err) {
    return errorResponse(err)
  }
}
