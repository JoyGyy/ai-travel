/**
 * 分享路由
 * 提供行程分享的创建和查询接口
 */

import { Router } from 'express'
import { verifyToken } from '../services/auth.js'
import { createShare, getShare } from '../services/share.js'

const router = Router()

/** 创建分享 — 需要 JWT 认证 */
router.post('/share', (req, res) => {
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
router.get('/share/:id', (req, res) => {
  const share = getShare(req.params.id)
  if (!share) {
    return res.status(404).json({ success: false, message: '分享不存在' })
  }
  res.json({ success: true, data: share })
})

export default router
