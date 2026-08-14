import { createTravelRecommendStream } from '@/lib/ai/recommend'
import { consumeAiQuota } from '@/lib/services/auth'
import { httpError, withAuthRaw } from '@/lib/utils/http'

export const POST = withAuthRaw(async (req, { user }) => {
  const body = await req.json()
  const { budget, city, days } = body

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
  return createTravelRecommendStream({ budget, city, days })
})
