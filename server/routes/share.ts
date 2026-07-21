/**
 * 分享路由
 * 提供行程分享的创建和查询接口
 */

import { Buffer } from 'node:buffer'
import type { Request, Response } from 'express'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { createRateLimit } from '../middleware/rateLimit.js'
import { createShare, getShare } from '../services/share.js'
import { asyncHandler, httpError } from '../utils/http.js'
import { readPositiveInteger, readRequiredString } from '../utils/validation.js'

const router: ReturnType<typeof Router> = Router()

// ========== 常量与限流 ==========

/** 分享内容持久化上限（字节）：100KB */
const MAX_SHARE_BODY_SIZE = 100 * 1024

/** 分享查询接口限流：每 IP 每分钟最多 30 次 */
const shareGetLimiter = createRateLimit({ name: 'share:get', windowMs: 60_000, maxRequests: 30, message: '查询过于频繁，请稍后再试' })

/** 分享创建接口限流：每用户每分钟最多 10 次 */
const sharePostLimiter = createRateLimit({ name: 'share:post', windowMs: 60_000, maxRequests: 10, message: '创建分享过于频繁，请稍后再试' })

interface SharePayload {
  city: string
  days: number
  budget: string
  itinerary: unknown
}

// ========== 数据校验 ==========

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

// ========== 路由定义 ==========

/** 创建分享 — 需要 JWT 认证 */
router.post('/share', sharePostLimiter, requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const payload = validateSharePayload(req.body)
  const shareId = createShare(payload)
  res.json({ success: true, shareId, shareUrl: `/share/${shareId}` })
}))

/** 获取分享数据 — 公开接口 */
router.get('/share/:id', shareGetLimiter, asyncHandler(async (req: Request, res: Response) => {
  const id = (req.params as { id: string }).id
  const share = getShare(id)
  if (!share)
    throw httpError(404, '分享不存在')
  res.json({ success: true, data: share })
}))

export default router
