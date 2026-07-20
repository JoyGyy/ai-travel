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

const router = Router()

router.use(requireAuth)

function readFilters(query) {
  return {
    city: typeof query.city === 'string' ? query.city.trim() : '',
    keyword: typeof query.keyword === 'string' ? query.keyword.trim() : '',
    ticketType: ['free', 'paid'].includes(query.ticketType) ? query.ticketType : '',
    tag: typeof query.tag === 'string' ? query.tag.trim() : '',
    page: Number(query.page) || 1,
    pageSize: Number(query.pageSize) || 20,
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const user = requireAuthForRequest(req)
  const data = await listAttractions(readFilters(req.query), user.id)
  res.json({ success: true, data, message: 'ok' })
}))

router.get('/favorites', asyncHandler(async (req, res) => {
  const user = requireAuthForRequest(req)
  const items = await listFavoriteAttractions(user.id)
  res.json({ success: true, data: { items, total: items.length, cities: [], tags: [] }, message: 'ok' })
}))

router.get('/:id', asyncHandler(async (req, res) => {
  const user = requireAuthForRequest(req)
  const data = await getAttractionById(req.params.id, user.id)
  if (!data)
    throw httpError(404, '景点不存在')
  res.json({ success: true, data, message: 'ok' })
}))

router.post('/:id/favorite', asyncHandler(async (req, res) => {
  const user = requireAuthForRequest(req)
  const data = await favoriteAttraction(user.id, req.params.id)
  res.json({ success: true, data, message: '已收藏' })
}))

router.delete('/:id/favorite', asyncHandler(async (req, res) => {
  const user = requireAuthForRequest(req)
  const data = await unfavoriteAttraction(user.id, req.params.id)
  res.json({ success: true, data, message: '已取消收藏' })
}))

export default router
