/**
 * 旅行推荐路由
 * POST /api/travel/recommend - 生成行程推荐
 */

import type { Request, Response } from 'express'
import { Router } from 'express'
import { consumeAiQuotaForRequest } from '../middleware/aiQuota.js'
import { requireAuthForRequest } from '../middleware/auth.js'
import { executeAgent } from '../services/agent.js'
import { asyncHandler } from '../utils/http.js'
import { createLogger } from '../utils/logger.js'
import { initSSE, sendError } from '../utils/sse.js'

const log = createLogger('travel')
import { readPositiveInteger, readPositiveNumber, readRequiredString } from '../utils/validation.js'

const router: ReturnType<typeof Router> = Router()

// ========== 路由定义 ==========

/**
 * POST /api/travel/recommend
 * 请求体：{ city: string, budget: number, days: number }
 * 响应：SSE 流，最终返回 ItineraryResult
 */
router.post('/recommend', asyncHandler(async (req: Request, res: Response) => {
  const city = readRequiredString(req.body.city, '目的地城市', { min: 1, max: 50 })
  const budget = readPositiveNumber(req.body.budget, '预算', { min: 1, max: 1_000_000 })
  const days = readPositiveInteger(req.body.days, '行程天数', { min: 1, max: 30 })

  requireAuthForRequest(req)
  await consumeAiQuotaForRequest(req, res)

  try {
    // 初始化 SSE 连接
    initSSE(res)

    // 执行 Agent 流程
    await executeAgent(res, { city, budget, days })
  }
  catch (err: unknown) {
    log.error('行程推荐失败:', err)
    sendError(res, '生成行程时出现错误，请稍后重试')
  }
  finally {
    res.end()
  }
}))

export default router
