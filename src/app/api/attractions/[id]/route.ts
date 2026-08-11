/**
 * 景点浏览路由 — 景点详情
 * GET /api/attractions/[id]
 * 需要登录
 */
import { NextResponse } from 'next/server'

import { getAttractionById } from '@/lib/services/attractions/attractionService'
import { httpError, withAuth } from '@/lib/utils/http'

export const GET = withAuth<{ params: Promise<{ id: string }> }>(async (req, { user, params }) => {
  const { id } = await params
  const data = await getAttractionById(id, user.id)
  if (!data) throw httpError(404, '景点不存在')

  return NextResponse.json({ success: true, data, message: 'ok' })
})
