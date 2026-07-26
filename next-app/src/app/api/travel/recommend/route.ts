/**
 * 行程推荐 API（SSE 流式）
 * POST /api/travel/recommend
 * 请求体：{ city: string, budget: number, days: number }
 */
import { consumeAiQuota } from '@/lib/services/auth'
import { createSSEStream } from '@/lib/utils/sse'
import { errorResponse, httpError } from '@/lib/utils/http'
import { getAuthFromHeaders } from '@/lib/services/auth'

export async function POST(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: '未登录' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { city, budget, days } = body

    // 参数校验
    if (!city || typeof city !== 'string' || city.length > 50) {
      throw httpError(400, '请提供有效的目的地城市')
    }
    if (typeof budget !== 'number' || budget <= 0 || budget > 1_000_000) {
      throw httpError(400, '请提供有效的预算金额')
    }
    if (typeof days !== 'number' || days < 1 || days > 30 || !Number.isInteger(days)) {
      throw httpError(400, '行程天数应为 1-30 的整数')
    }

    // 消耗 AI 配额
    const quota = await consumeAiQuota(user.id)

    // 动态导入 agent 服务（避免循环依赖）
    const { executeAgent } = await import('@/lib/services/agent')

    return createSSEStream(async (send) => {
      await executeAgent(send, { city, budget, days })
    })
  }
  catch (err) {
    return errorResponse(err)
  }
}
