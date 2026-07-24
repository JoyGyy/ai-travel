/**
 * 景点浏览路由 — 景点列表
 * GET /api/attractions
 * 支持筛选和分页，需要登录
 */
import { NextResponse } from 'next/server'

import { getAuthFromHeaders } from '@/lib/services/auth'
import { listAttractions } from '@/lib/services/attractions/attractionService'
import { errorResponse } from '@/lib/utils/http'

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

export async function GET(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const data = await listAttractions(readFilters(searchParams), user.id)

    return NextResponse.json({ success: true, data, message: 'ok' })
  }
  catch (err) {
    return errorResponse(err)
  }
}
