/**
 * 本地存储工具模块
 * 使用 localStorage 持久化用户的行程历史和收藏数据
 */
import type { HistoryRecord, ItineraryResult } from '@/types'

// 存储键名常量
const HISTORY_KEY = 'travel_history' // 历史记录的存储键
const COLLECTIONS_KEY = 'travel_collections' // 收藏的存储键
const MAX_HISTORY = 20 // 历史记录最大保存数量
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
 * 加载历史记录列表
 * @returns 历史记录数组，如果没有数据则返回空数组
 */
export function loadHistory(): HistoryRecord[] {
  return safeJsonParse<HistoryRecord[]>(HISTORY_KEY, [])
}

/**
 * 保存行程结果到历史记录
 * 将新记录插入到数组开头（最新的在前面），并限制最大数量
 * @param result - AI 生成的行程结果
 */
export function saveToHistory(result: ItineraryResult): void {
  const history = loadHistory()
  // 将行程结果转换为历史记录格式并插入到数组开头
  history.unshift({
    city: result.city,
    days: result.days,
    budget: result.totalBudget,
    date: new Date().toLocaleDateString('zh-CN'), // 使用中文日期格式
    itinerary: result.dailyItinerary || [],
    budgetBreakdown: result.budgetBreakdown || null,
    tips: result.tips || [],
  })
  // 限制历史记录数量，超过上限时删除最早的记录
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

/**
 * 删除指定索引的历史记录
 * @param index - 要删除的记录在数组中的索引
 */
export function deleteHistoryRecord(index: number): void {
  const history = loadHistory()
  history.splice(index, 1) // 删除指定位置的记录
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
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
  collections.unshift(record) // 新收藏插入到开头
  // 限制收藏数量
  if (collections.length > MAX_COLLECTIONS) {
    collections.length = MAX_COLLECTIONS
  }
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections))
}

/**
 * 加载行程缓存
 * 用于避免重复请求相同参数的行程数据
 * @param city - 城市名
 * @param budget - 预算
 * @param days - 天数
 * @returns 缓存的行程数据，如果没有缓存则返回 null
 */
export function loadItineraryCache(city: string, budget: number, days: number): {
  itinerary: ItineraryResult['dailyItinerary']
  budgetBreakdown: ItineraryResult['budgetBreakdown'] | null
  tips: string[]
} | null {
  // 使用城市、预算、天数组合作为缓存键
  const key = `detail_${city}_${budget}_${days}`
  const raw = localStorage.getItem(key)
  if (!raw)
    return null
  try {
    return JSON.parse(raw)
  }
  catch {
    return null // 解析失败时返回 null
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
}): void {
  const key = `detail_${city}_${budget}_${days}`
  localStorage.setItem(key, JSON.stringify(data))
}
