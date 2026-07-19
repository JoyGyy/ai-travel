import { consumeAiQuota } from '../services/auth.js'

export async function consumeAiQuotaForRequest(req, res) {
  const quota = await consumeAiQuota(req.user?.id)
  res.setHeader('X-AI-Quota-Limit', String(quota.limit))
  res.setHeader('X-AI-Quota-Remaining', String(quota.remaining))
  return quota
}

export async function requireAiQuota(req, res, next) {
  try {
    await consumeAiQuotaForRequest(req, res)
    next()
  }
  catch (err) {
    if (err.status === 429) {
      res.status(429).json({
        success: false,
        message: err.message,
        quota: err.quota,
      })
      return
    }
    next(err)
  }
}
