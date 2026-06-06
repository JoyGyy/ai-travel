/**
 * 天气查询路由
 * 提供城市天气查询接口
 */
import express from 'express'
import { getWeather } from '../services/weather.js'

const router = express.Router()

/**
 * GET /api/weather?city=北京
 * 查询指定城市的天气信息
 */
router.get('/weather', async (req, res) => {
  const city = req.query.city
  if (!city) {
    return res.status(400).json({ error: '缺少城市参数' })
  }

  try {
    const weather = await getWeather(city)
    if (!weather) {
      return res.status(404).json({ error: '未找到该城市天气信息' })
    }
    res.json(weather)
  }
  catch (err) {
    console.error('天气查询失败:', err)
    res.status(500).json({ error: '天气查询失败' })
  }
})

export default router
