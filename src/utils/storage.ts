/**
 * 本地存储工具模块
 * 使用 localStorage 持久化行程缓存数据
 */

export function loadItineraryCache(city: string, budget: number, days: number): Record<string, unknown> | null {
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

export function saveItineraryCache(city: string, budget: number, days: number, data: Record<string, unknown>): void {
  const key = `detail_${city}_${budget}_${days}`
  localStorage.setItem(key, JSON.stringify(data))
}
