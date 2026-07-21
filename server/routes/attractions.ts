/**
 * 景点浏览路由
 * 提供景点列表查询、详情查看、收藏/取消收藏功能，需要登录
 */

import type { Request, Response } from 'express'
import { Router } from 'express'
import { requireAuth, requireAuthForRequest } from '../middleware/auth.js'
import {
  favoriteAttraction,
  getAttractionById,
  listAttractions,
  listFavoriteAttractions,
  unfavoriteAttraction,
} from '../services/attractions/attractionService.js'
import { asyncHandler, httpError } from '../utils/http.js'

const router: ReturnType<typeof Router> = Router()

// 所有景点浏览接口都需要认证
router.use(requireAuth)

interface AttractionFilters {
  city: string
  keyword: string
  ticketType: string
  tag: string
  page: number
  pageSize: number
}

// ========== 查询参数解析 ==========

function readFilters(query: Record<string, unknown>): Record<string, unknown> {
  return {
    city: typeof query.city === 'string' ? query.city.trim() : '',
    keyword: typeof query.keyword === 'string' ? query.keyword.trim() : '',
    ticketType: ['free', 'paid'].includes(query.ticketType as string) ? (query.ticketType as string) : '',
    tag: typeof query.tag === 'string' ? query.tag.trim() : '',
    page: Number(query.page) || 1,
    pageSize: Number(query.pageSize) || 20,
  }
}

// ========== 路由定义 ==========

/** 景点列表（支持筛选和分页） */
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const data = await listAttractions(readFilters(req.query as Record<string, unknown>), user.id)
  res.json({ success: true, data, message: 'ok' })
}))

/** 用户收藏列表 */
router.get('/favorites', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const items = await listFavoriteAttractions(user.id)
  res.json({ success: true, data: { items, total: items.length, cities: [], tags: [] }, message: 'ok' })
}))

/** 景点详情 */
router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const id = (req.params as { id: string }).id
  const data = await getAttractionById(id, user.id)
  if (!data)
    throw httpError(404, '景点不存在')
  res.json({ success: true, data, message: 'ok' })
}))

/** 收藏景点 */
router.post('/:id/favorite', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const id = (req.params as { id: string }).id
  const data = await favoriteAttraction(user.id, id)
  res.json({ success: true, data, message: '已收藏' })
}))

/** 取消收藏 */
router.delete('/:id/favorite', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const id = (req.params as { id: string }).id
  const data = await unfavoriteAttraction(user.id, id)
  res.json({ success: true, data, message: '已取消收藏' })
}))

export default router
