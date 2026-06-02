/**
 * 本地存储工具模块
 * 使用 localStorage 持久化用户的行程缓存数据
 */
import type { AccommodationInfo, ItineraryResult, NightlifeInfo, WeatherInfo } from '@/types'
import { useHistoryStore } from '@/stores/history'

/**
 * 保存行程结果到历史记录
 * @param result - AI 生成的行程结果
 */
export function saveToHistory(result: ItineraryResult): void {
  const now = Date.now()
  const record = {
    city: result.city,
    days: result.days,
    budget: result.totalBudget,
    date: new Date(now).toLocaleDateString('zh-CN'),
    timestamp: now,
    itinerary: result.dailyItinerary || [],
    budgetBreakdown: result.budgetBreakdown || null,
    tips: result.tips || [],
    weather: result.weather || null,
    accommodation: result.accommodation || [],
    nightlife: result.nightlife || [],
  }
  useHistoryStore.getState().addRecord(record as any)
}

/**
 * 加载行程缓存
 * @param city - 城市名
 * @param budget - 预算
 * @param days - 天数
 * @returns 缓存的行程数据，如果没有缓存则返回 null
 */
export function loadItineraryCache(city: string, budget: number, days: number): {
  itinerary: ItineraryResult['dailyItinerary']
  budgetBreakdown: ItineraryResult['budgetBreakdown'] | null
  tips: string[]
  weather?: WeatherInfo | null
  accommodation?: AccommodationInfo[]
  nightlife?: NightlifeInfo[]
} | null {
  const key = `detail_${city}_${budget}_${days}`
  const raw = localStorage.getItem(key)
  if (!raw)
    return null
  try {
    return JSON.parse(raw)
  }
  catch {
    return null
  }
}

/**
 * 保存行程到缓存
 * @param city - 城市名
 * @param budget - 预算
 * @param days - 天数
 * @param data - 要缓存的行程数据
 */
export function saveItineraryCache(city: string, budget: number, days: number, data: {
  itinerary: ItineraryResult['dailyItinerary']
  budgetBreakdown: ItineraryResult['budgetBreakdown'] | null
  tips: string[]
  weather?: WeatherInfo | null
  accommodation?: AccommodationInfo[]
  nightlife?: NightlifeInfo[]
}): void {
  const key = `detail_${city}_${budget}_${days}`
  localStorage.setItem(key, JSON.stringify(data))
}
