/**
 * 景点相关类型定义
 *
 * 定义景点数据结构、筛选参数、列表/详情响应类型，
 * 供前端景点展示和后端 API 共同使用。
 */

// --- 门票类型：免费 / 付费 ---
export type AttractionTicketType = 'free' | 'paid'

// --- 第三方预订链接 ---
export interface AttractionBookingLinks {
  ctrip?: string
  fliggy?: string
  ly?: string
}

// --- 景点完整数据结构 ---
export interface Attraction {
  id: string
  name: string
  city: string
  ticketType: AttractionTicketType
  priceText: string
  coverImage: string
  summary: string
  description: string
  address: string
  openingHours: string
  recommendedDuration: string
  tags: string[]
  aliases?: string[]
  highlights: string[]
  tips: string[]
  suitableFor: string[]
  bookingLinks: AttractionBookingLinks
  isFavorite?: boolean
}

// --- 景点筛选参数 ---
export interface AttractionFilters {
  city?: string
  keyword?: string
  ticketType?: AttractionTicketType | ''
  tag?: string
  page?: number
  pageSize?: number
}

// --- 景点列表接口响应 ---
export interface AttractionListData {
  items: Attraction[]
  total: number
  page?: number
  cities: string[]
  tags: string[]
}

// --- 景点详情接口响应 ---
export interface AttractionDetailData {
  attraction: Attraction
  isFavorite: boolean
}

// --- 收藏操作结果 ---
export interface FavoriteResult {
  isFavorite: boolean
}
