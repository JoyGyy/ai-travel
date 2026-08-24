/**
 * 景点浏览路由 — 景点列表
 * GET /api/attractions
 * 支持筛选和分页，支持游客浏览与已登录用户收藏标记
 */
import { NextResponse } from 'next/server'

import { listAttractions } from '@/lib/services/attractions/attractionService'
import { getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'
import { readPositiveInteger } from '@/lib/utils/validation'

function readFilters(query: URLSearchParams): Record<string, unknown> {
  return {
    city: query.get('city')?.trim() || '',
    keyword: query.get('keyword')?.trim() || '',
    page: readPositiveInteger(query.get('page') || '1', '页码', { max: 10_000, min: 1 }),
    pageSize: readPositiveInteger(query.get('pageSize') || '20', '每页数量', { max: 100, min: 1 }),
    tag: query.get('tag')?.trim() || '',
    ticketType: ['free', 'paid'].includes(query.get('ticketType') || '')
      ? query.get('ticketType')
      : '',
  }
}

export async function GET(req: Request) {
  try {
    const user = await getAuthFromHeaders(req.headers)
    const { searchParams } = new URL(req.url)
    const data = await listAttractions(readFilters(searchParams), user?.id)

    return NextResponse.json({ data, message: 'ok', success: true })
  }
  catch (err) {
    return errorResponse(err)
  }
}
