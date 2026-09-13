/**
 * 本地存储工具模块
 *
 * 使用 localStorage 持久化行程规划的缓存数据，
 * 以城市+预算+天数作为缓存键，避免重复请求。
 */
import { z } from 'zod'

import type {
  Accommodation,
  AttractionRef,
  BudgetBreakdown,
  ItineraryDay,
} from '@/stores/itinerary'
import type { WeatherResponse } from '@/types/api'

// --- 行程缓存数据结构 ---
export interface ItineraryCache {
  accommodation: Accommodation[]
  attractionRefs: AttractionRef[]
  budgetBreakdown: BudgetBreakdown | null
  itinerary: ItineraryDay[]
  nightlife: string[]
  tips: string[]
  weather: null | WeatherResponse
}

export const itineraryCacheSchema = z.object({
  accommodation: z.array(z.any()).default([]),
  attractionRefs: z.array(z.any()).default([]),
  budgetBreakdown: z.any().nullable().optional().default(null),
  itinerary: z.array(z.any()),
  nightlife: z.array(z.string()).default([]),
  tips: z.array(z.string()).default([]),
  weather: z.any().nullable().optional().default(null),
})

// --- 从 localStorage 加载缓存 ---
export function loadItineraryCache(
  city: string,
  budget: number,
  days: number,
): ItineraryCache | null {
  if (typeof localStorage === 'undefined')
    return null

  const key = `detail_${city}_${budget}_${days}`
  const raw = localStorage.getItem(key)
  if (!raw)
    return null

  try {
    const parsed = JSON.parse(raw)
    const result = itineraryCacheSchema.safeParse(parsed)
    if (!result.success) {
      localStorage.removeItem(key)
      return null
    }
    return result.data as ItineraryCache
  }
  catch {
    localStorage.removeItem(key)
    return null
  }
}

// --- 将行程数据写入 localStorage 缓存 ---
export function saveItineraryCache(
  city: string,
  budget: number,
  days: number,
  data: ItineraryCache,
): void {
  if (typeof localStorage === 'undefined')
    return

  const key = `detail_${city}_${budget}_${days}`
  localStorage.setItem(key, JSON.stringify(data))
}
