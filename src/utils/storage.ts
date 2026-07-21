/**
 * 本地存储工具模块
 * 使用 localStorage 持久化行程缓存数据
 */
import type { Accommodation, AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'
import type { WeatherResponse } from '@/types/api'

export interface ItineraryCache {
  itinerary: ItineraryDay[]
  budgetBreakdown: BudgetBreakdown | null
  tips: string[]
  weather: WeatherResponse | null
  accommodation: Accommodation[]
  nightlife: string[]
  attractionRefs: AttractionRef[]
}

export function loadItineraryCache(city: string, budget: number, days: number): ItineraryCache | null {
  const key = `detail_${city}_${budget}_${days}`
  const raw = localStorage.getItem(key)
  if (!raw)
    return null
  try {
    return JSON.parse(raw) as ItineraryCache
  }
  catch {
    return null
  }
}

export function saveItineraryCache(city: string, budget: number, days: number, data: ItineraryCache): void {
  const key = `detail_${city}_${budget}_${days}`
  localStorage.setItem(key, JSON.stringify(data))
}
