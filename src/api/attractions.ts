import type { AttractionDetailData, AttractionFilters, AttractionListData, FavoriteResult } from '@/types/attraction'

import { request } from './client'

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

export async function fetchAttractions(filters: AttractionFilters = {}): Promise<AttractionListData> {
  const res = await request<DataResponse<AttractionListData>>(`/api/attractions${buildQuery(filters)}`, { auth: true })
  return res.data
}

export async function fetchAttractionDetail(id: string): Promise<AttractionDetailData> {
  const res = await request<DataResponse<AttractionDetailData>>(`/api/attractions/${id}`, { auth: true })
  return res.data
}

export async function fetchFavoriteAttractions(): Promise<AttractionListData> {
  const res = await request<DataResponse<AttractionListData>>('/api/attractions/favorites', { auth: true })
  return res.data
}

export async function favoriteAttraction(id: string): Promise<FavoriteResult> {
  const res = await request<DataResponse<FavoriteResult>>(`/api/attractions/${id}/favorite`, { method: 'POST', auth: true })
  return res.data
}

export async function unfavoriteAttraction(id: string): Promise<FavoriteResult> {
  const res = await request<DataResponse<FavoriteResult>>(`/api/attractions/${id}/favorite`, { method: 'DELETE', auth: true })
  return res.data
}
