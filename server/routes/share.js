/**
 * 分享路由
 * 提供行程分享的创建和查询接口
 */

import { Router } from 'express'
import { verifyToken } from '../services/auth.js'
import { createShare, getShare } from '../services/share.js'
import { createRateLimit } from '../middleware/rateLimit.js'

const router = Router()

/** 分享查询接口限流：每 IP 每分钟最多 30 次 */
const shareGetLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 30, message: '查询过于频繁，请稍后再试' })

/** 分享创建接口限流：每用户每分钟最多 10 次 */
const sharePostLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 10, message: '创建分享过于频繁，请稍后再试' })

/** 请求体大小上限（字节）：100KB */
const MAX_BODY_SIZE = 100 * 1024

/** 创建分享 — 需要 JWT 认证 */
router.post('/share', sharePostLimiter, (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录' })
    }

    const token = authHeader.slice(7)
    verifyToken(token) // 仅验证令牌有效性，无需使用返回值

    const { city, days, budget, itinerary } = req.body
    if (!city || !days || !budget || !itinerary) {
      return res.status(400).json({ success: false, message: '缺少必要参数' })
    }

    // 校验请求体大小，防止滥用
    const bodySize = JSON.stringify(req.body).length
    if (bodySize > MAX_BODY_SIZE) {
      return res.status(413).json({ success: false, message: '请求数据过大' })
    }

    const shareId = createShare({ city, days, budget, itinerary })
    res.json({ success: true, shareId, shareUrl: `/share/${shareId}` })
  }
  catch (err) {
    // verifyToken 抛出异常说明令牌无效
    if (err.message?.includes('invalid') || err.message?.includes('expired') || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: '令牌无效或已过期' })
    }
    res.status(500).json({ success: false, message: '创建分享失败' })
  }
})

/** 获取分享数据 — 公开接口 */
router.get('/share/:id', shareGetLimiter, (req, res) => {
  const share = getShare(req.params.id)
  if (!share) {
    return res.status(404).json({ success: false, message: '分享不存在' })
  }
  res.json({ success: true, data: share })
})

export default router
