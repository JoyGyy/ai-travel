/**
 * 景点浏览路由 — 景点列表
 * GET /api/attractions
 * 支持筛选和分页，需要登录
 */
import { NextResponse } from 'next/server'

import { listAttractions } from '@/lib/services/attractions/attractionService'
import { withAuth } from '@/lib/utils/http'

function readFilters(query: URLSearchParams): Record<string, unknown> {
  return {
    city: query.get('city')?.trim() || '',
    keyword: query.get('keyword')?.trim() || '',
    ticketType: ['free', 'paid'].includes(query.get('ticketType') || '') ? query.get('ticketType') : '',
    tag: query.get('tag')?.trim() || '',
    page: Number(query.get('page')) || 1,
    pageSize: Number(query.get('pageSize')) || 20,
  }
}

export const GET = withAuth(async (req, { user }) => {
  const { searchParams } = new URL(req.url)
  const data = await listAttractions(readFilters(searchParams), user.id)

  return NextResponse.json({ success: true, data, message: 'ok' })
})
