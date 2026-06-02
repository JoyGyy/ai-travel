/**
 * 本地存储工具模块
 * 使用 localStorage 持久化用户的行程历史和收藏数据
 */
import type { AccommodationInfo, HistoryRecord, ItineraryResult, NightlifeInfo, WeatherInfo } from '@/types'
import { useHistoryStore } from '@/stores/history'

// 存储键名常量
const COLLECTIONS_KEY = 'travel_collections' // 收藏的存储键
const MAX_COLLECTIONS = 50 // 收藏最大保存数量

/**
 * 安全地解析 JSON 数据
 * @param key - localStorage 的键名
 * @param fallback - 解析失败时的默认值
 * @returns 解析后的数据或默认值
 */
function safeJsonParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  }
  catch {
    return fallback // JSON 解析失败时返回默认值
  }
}

/**
 * 保存行程结果到历史记录
 * 通过 Zustand store 写入，避免与 persist 中间件的双写冲突
 * @param result - AI 生成的行程结果
 */
export function saveToHistory(result: ItineraryResult): void {
  const record: HistoryRecord = {
    city: result.city,
    days: result.days,
    budget: result.totalBudget,
    date: new Date().toLocaleDateString('zh-CN'),
    itinerary: result.dailyItinerary || [],
    budgetBreakdown: result.budgetBreakdown || null,
    tips: result.tips || [],
    weather: result.weather || null,
    accommodation: result.accommodation || [],
    nightlife: result.nightlife || [],
  }
  useHistoryStore.getState().addRecord(record)
}

/**
 * 加载收藏列表
 * @returns 收藏记录数组
 */
export function loadCollections(): HistoryRecord[] {
  return safeJsonParse<HistoryRecord[]>(COLLECTIONS_KEY, [])
}

/**
 * 保存行程到收藏
 * @param record - 要收藏的历史记录
 */
export function saveToCollections(record: HistoryRecord): void {
  const collections = loadCollections()
  collections.unshift(record)
  if (collections.length > MAX_COLLECTIONS) {
    collections.length = MAX_COLLECTIONS
  }
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
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
