/**
 * 景点相关类型定义
 *
 * 定义景点数据结构、筛选参数、列表/详情响应类型，
 * 供前端景点展示和后端 API 共同使用。
 */

// --- 景点完整数据结构 ---
export interface Attraction {
  address: string
  aliases?: string[]
  bookingLinks: AttractionBookingLinks
  city: string
  coverImage: string
  description: string
  highlights: string[]
  id: string
  isFavorite?: boolean
  name: string
  openingHours: string
  priceText: string
  recommendedDuration: string
  suitableFor: string[]
  summary: string
  tags: string[]
  ticketType: AttractionTicketType
  tips: string[]
}

// --- 第三方预订链接 ---
export interface AttractionBookingLinks {
  ctrip?: string
  fliggy?: string
  ly?: string
}

// --- 景点详情接口响应 ---
export interface AttractionDetailData {
  attraction: Attraction
  isFavorite: boolean
}

// --- 景点筛选参数 ---
export interface AttractionFilters {
  city?: string
  keyword?: string
  page?: number
  pageSize?: number
  tag?: string
  ticketType?: '' | AttractionTicketType
}

// --- 景点列表接口响应 ---
export interface AttractionListData {
  cities: string[]
  items: Attraction[]
  page?: number
  tags: string[]
  total: number
}

// --- 门票类型：免费 / 付费 ---
export type AttractionTicketType = 'free' | 'paid'

// --- 收藏操作结果 ---
export interface FavoriteResult {
  isFavorite: boolean
}
