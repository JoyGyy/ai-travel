import type { AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'
import type { WeatherResponse } from '@/types/api'

export interface CommunityAuthor {
  id: string
  username: string
}

export interface CommunityComment {
  author: CommunityAuthor
  content: string
  createdAt: string
  id: string
  postId: string
  updatedAt: string
}

export interface CommunityCommentFilters {
  page?: number
  pageSize?: number
}

export interface CommunityCommentListData {
  items: CommunityComment[]
  page: number
  pageSize: number
  total: number
}

export interface CommunityImage {
  altText: string
  createdAt?: string
  id?: string
  sortOrder?: number
  storageKey: string
  url: string
}

export interface CommunityItinerarySnapshot {
  attractionRefs?: AttractionRef[]
  budget: number
  budgetBreakdown?: BudgetBreakdown | null
  city: string
  days: number
  itinerary: ItineraryDay[]
  tips?: string[]
  weather?: null | WeatherResponse
}

export interface CommunityPost extends CommunityPostSummary {
  originalPost: CommunityPostSummary | null
}

export interface CommunityPostFilters {
  authorId?: string
  city?: string
  page?: number
  pageSize?: number
  withItinerary?: boolean
}

export interface CommunityPostListData {
  items: CommunityPost[]
  page: number
  pageSize: number
  total: number
}

export interface CommunityPostSummary {
  author: CommunityAuthor
  city: string
  commentCount: number
  content: string
  createdAt: string
  id: string
  images: CommunityImage[]
  itinerarySnapshot: CommunityItinerarySnapshot | null
  likeCount: number
  likedByMe: boolean
  postType: CommunityPostType
  repostCount: number
  title: string
  updatedAt: string
}

export type CommunityPostType = 'original' | 'repost'

export interface CreateCommunityCommentInput {
  content: string
}

export interface CreateCommunityCommentResult {
  comment: CommunityComment
  commentCount: number
}

export interface CreateCommunityPostInput {
  city?: string
  content?: string
  images?: CommunityImage[]
  itinerarySnapshot?: CommunityItinerarySnapshot | null
  title?: string
}

export interface LikeCommunityPostResult {
  likeCount: number
  likedByMe: boolean
}
