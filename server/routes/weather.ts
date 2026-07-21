/**
 * 天气查询路由
 * 提供城市天气查询接口
 */
import type { Request, Response } from 'express'
import { Router } from 'express'
import { getWeather } from '../services/weather.js'
import { asyncHandler, httpError } from '../utils/http.js'
import { readRequiredString } from '../utils/validation.js'

const router: ReturnType<typeof Router> = Router()

/**
 * GET /api/weather?city=北京
 * 查询指定城市的天气信息
 */
router.get('/weather', asyncHandler(async (req: Request, res: Response) => {
  const city = readRequiredString(req.query.city, '城市名称', { min: 1, max: 50 })
  const weather = await getWeather(city)
  if (!weather)
    throw httpError(404, '未找到该城市天气信息')
  res.json(weather)
}))

export default router
