import type { NextFunction, Request, Response } from 'express'

import { consumeAiQuota } from '../services/auth.js'

export async function consumeAiQuotaForRequest(req: Request, res: Response) {
  const quota = await consumeAiQuota((req as Request & { user?: { id: string } }).user?.id)
  res.setHeader('X-AI-Quota-Limit', String(quota.limit))
  res.setHeader('X-AI-Quota-Remaining', String(quota.remaining))
  return quota
}

export async function requireAiQuota(req: Request, res: Response, next: NextFunction) {
  try {
    await consumeAiQuotaForRequest(req, res)
    next()
  }
  catch (err: unknown) {
    const error = err as { status?: number, message?: string, quota?: { used: number, limit: number, remaining: number } }
    if (error.status === 429) {
      res.status(429).json({
        success: false,
        message: error.message,
        quota: error.quota,
      })
      return
    }
    next(err)
  }
}
