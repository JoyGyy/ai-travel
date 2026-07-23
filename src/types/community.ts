import type { AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'
import type { WeatherResponse } from '@/types/api'

export type CommunityPostType = 'original' | 'repost'

export interface CommunityAuthor {
  id: string
  username: string
}

export interface CommunityImage {
  id?: string
  url: string
  storageKey: string
  altText: string
  sortOrder?: number
  createdAt?: string
}

export interface CommunityItinerarySnapshot {
  city: string
  days: number
  budget: number
  itinerary: ItineraryDay[]
  budgetBreakdown?: BudgetBreakdown | null
  weather?: WeatherResponse | null
  tips?: string[]
  attractionRefs?: AttractionRef[]
}

export interface CommunityPostSummary {
  id: string
  postType: CommunityPostType
  author: CommunityAuthor
  title: string
  content: string
  city: string
  itinerarySnapshot: CommunityItinerarySnapshot | null
  images: CommunityImage[]
  likeCount: number
  commentCount: number
  repostCount: number
  likedByMe: boolean
  createdAt: string
  updatedAt: string
}

export interface CommunityPost extends CommunityPostSummary {
  originalPost: CommunityPostSummary | null
}

export interface CommunityComment {
  id: string
  postId: string
  author: CommunityAuthor
  content: string
  createdAt: string
  updatedAt: string
}

export interface CommunityPostFilters {
  page?: number
  pageSize?: number
  city?: string
  withItinerary?: boolean
  authorId?: string
}

export interface CommunityCommentFilters {
  page?: number
  pageSize?: number
}

export interface CommunityPostListData {
  items: CommunityPost[]
  total: number
  page: number
  pageSize: number
}

export interface CommunityCommentListData {
  items: CommunityComment[]
  total: number
  page: number
  pageSize: number
}

export interface CreateCommunityPostInput {
  title?: string
  content?: string
  city?: string
  itinerarySnapshot?: CommunityItinerarySnapshot | null
  images?: CommunityImage[]
}

export interface CreateCommunityCommentInput {
  content: string
}

export interface LikeCommunityPostResult {
  likedByMe: boolean
  likeCount: number
}

export interface CreateCommunityCommentResult {
  comment: CommunityComment
  commentCount: number
}
