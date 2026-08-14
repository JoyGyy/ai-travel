import { NextResponse } from 'next/server'
/**
 * 分享路由 — 创建行程分享
 * POST /api/travel/share
 */
import { Buffer } from 'node:buffer'

import { createShare } from '@/lib/services/share'
import { httpError, withProtected } from '@/lib/utils/http'
import { readPositiveInteger, readRequiredString } from '@/lib/utils/validation'

/** 分享内容持久化上限（字节）：100KB */
const MAX_SHARE_BODY_SIZE = 100 * 1024

interface SharePayload {
  budget: string
  city: string
  days: number
  itinerary: unknown
}

function validateSharePayload(payload: unknown): SharePayload {
  if (!payload || typeof payload !== 'object') throw httpError(400, '缺少分享数据')

  const p = payload as Record<string, unknown>

  if (Buffer.byteLength(JSON.stringify(p), 'utf8') > MAX_SHARE_BODY_SIZE)
    throw httpError(400, '请求数据过大')

  const city = readRequiredString(p.city, '城市名称', { max: 50, min: 1 })
  const days = readPositiveInteger(p.days, '行程天数', { max: 30, min: 1 })
  const budget = readRequiredString(String(p.budget ?? ''), '预算', { max: 50, min: 1 })

  if (!p.itinerary) throw httpError(400, '缺少行程数据')

  return { budget, city, days, itinerary: p.itinerary }
}

export const POST = withProtected(
  async (req) => {
    const payload = validateSharePayload(await req.json())
    const shareId = createShare(payload)

    return NextResponse.json({ shareId, shareUrl: `/share/${shareId}`, success: true })
  },
  { rateLimit: { max: 10, name: 'share:post', windowMs: 60_000 } },
)
