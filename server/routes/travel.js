/**
 * 旅行推荐路由
 * POST /api/travel/recommend - 生成行程推荐
 */

import { Router } from 'express'
import { executeAgent } from '../services/agent.js'
import { initSSE, sendError } from '../utils/sse.js'

const router = Router()

/**
 * POST /api/travel/recommend
 * 请求体：{ city: string, budget: number, days: number }
 * 响应：SSE 流，最终返回 ItineraryResult
 */
router.post('/recommend', async (req, res) => {
  try {
    // 初始化 SSE 连接
    initSSE(res)

    const { city, budget, days } = req.body

    if (!city) {
      sendError(res, '请选择目的地城市')
      res.end()
      return
    }

    // 执行 Agent 流程
    await executeAgent(res, { city, budget, days })
  }
  catch (err) {
    console.error('行程推荐失败:', err)
    sendError(res, '生成行程时出现错误，请稍后重试')
  }
  finally {
    res.end()
  }
})

export default router
