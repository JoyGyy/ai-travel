import { createTravelRecommendStream } from '@/lib/ai/recommend'
import { consumeAiQuota, getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse, httpError } from '@/lib/utils/http'

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

    if (!city || typeof city !== 'string' || city.length > 50) {
      throw httpError(400, '请提供有效的目的地城市')
    }
    if (typeof budget !== 'number' || budget <= 0 || budget > 1_000_000) {
      throw httpError(400, '请提供有效的预算金额')
    }
    if (typeof days !== 'number' || days < 1 || days > 30 || !Number.isInteger(days)) {
      throw httpError(400, '行程天数应为 1-30 的整数')
    }

    await consumeAiQuota(user.id)
    return createTravelRecommendStream({ city, budget, days })
  }
  catch (err) {
    return errorResponse(err)
  }
}
