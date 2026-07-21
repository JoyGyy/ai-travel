/**
 * 景点相关 API
 *
 * 提供景点列表查询、详情获取、收藏/取消收藏等功能，
 * 所有接口均需 JWT 认证。
 */
import type { AttractionDetailData, AttractionFilters, AttractionListData, FavoriteResult } from '@/types/attraction'

import { request } from './client'

/** 将筛选参数对象转换为 URL 查询字符串 */
function buildQuery(filters: AttractionFilters = {}) {
  const params = new URLSearchParams()
  if (filters.city) {
    params.set('city', filters.city)
  }
  if (filters.ticketType) {
    params.set('ticketType', filters.ticketType)
  }
  if (filters.keyword) {
    params.set('keyword', filters.keyword)
  }
  if (filters.tag) {
    params.set('tag', filters.tag)
  }
  if (filters.page) {
    params.set('page', String(filters.page))
  }
  if (filters.pageSize) {
    params.set('pageSize', String(filters.pageSize))
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

interface DataResponse<T> {
  data: T
}

/** 获取景点列表（支持筛选和分页） */
export async function fetchAttractions(filters: AttractionFilters = {}): Promise<AttractionListData> {
  const res = await request<DataResponse<AttractionListData>>(`/api/attractions${buildQuery(filters)}`, { auth: true })
  return res.data
}

/** 获取景点详情 */
export async function fetchAttractionDetail(id: string): Promise<AttractionDetailData> {
  const res = await request<DataResponse<AttractionDetailData>>(`/api/attractions/${id}`, { auth: true })
  return res.data
}

/** 获取当前用户的收藏景点列表 */
export async function fetchFavoriteAttractions(): Promise<AttractionListData> {
  const res = await request<DataResponse<AttractionListData>>('/api/attractions/favorites', { auth: true })
  return res.data
}

/** 收藏景点 */
export async function favoriteAttraction(id: string): Promise<FavoriteResult> {
  const res = await request<DataResponse<FavoriteResult>>(`/api/attractions/${id}/favorite`, { method: 'POST', auth: true })
  return res.data
}

/** 取消收藏景点 */
export async function unfavoriteAttraction(id: string): Promise<FavoriteResult> {
  const res = await request<DataResponse<FavoriteResult>>(`/api/attractions/${id}/favorite`, { method: 'DELETE', auth: true })
  return res.data
}
