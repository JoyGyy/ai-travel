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

router.use(requireAuth)

interface AttractionFilters {
  city: string
  keyword: string
  ticketType: string
  tag: string
  page: number
  pageSize: number
}

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

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const data = await listAttractions(readFilters(req.query as Record<string, unknown>), user.id)
  res.json({ success: true, data, message: 'ok' })
}))

router.get('/favorites', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const items = await listFavoriteAttractions(user.id)
  res.json({ success: true, data: { items, total: items.length, cities: [], tags: [] }, message: 'ok' })
}))

router.get('/:id', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const id = (req.params as { id: string }).id
  const data = await getAttractionById(id, user.id)
  if (!data)
    throw httpError(404, '景点不存在')
  res.json({ success: true, data, message: 'ok' })
}))

router.post('/:id/favorite', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const id = (req.params as { id: string }).id
  const data = await favoriteAttraction(user.id, id)
  res.json({ success: true, data, message: '已收藏' })
}))

router.delete('/:id/favorite', asyncHandler(async (req: Request, res: Response) => {
  const user = requireAuthForRequest(req)
  const id = (req.params as { id: string }).id
  const data = await unfavoriteAttraction(user.id, id)
  res.json({ success: true, data, message: '已取消收藏' })
}))

export default router
