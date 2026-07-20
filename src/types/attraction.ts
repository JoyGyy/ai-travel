export type AttractionTicketType = 'free' | 'paid'

export interface AttractionBookingLinks {
  ctrip?: string
  fliggy?: string
  ly?: string
}

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

export interface AttractionFilters {
  city?: string
  keyword?: string
  ticketType?: AttractionTicketType | ''
  tag?: string
}

export interface AttractionListData {
  items: Attraction[]
  total: number
  cities: string[]
  tags: string[]
}

export interface AttractionDetailData {
  attraction: Attraction
  isFavorite: boolean
}

export interface FavoriteResult {
  isFavorite: boolean
}
