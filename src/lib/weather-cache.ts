/**
 * 天气查询缓存（模块级内存缓存）
 *
 * 缓存指定城市的天气数据，TTL 5 分钟，最多缓存 50 条。
 * 独立成模块，便于测试时清除缓存状态。
 */
import type { WeatherResponse } from '@/types/api'

interface CacheEntry {
  data: WeatherResponse
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000 // 5 分钟
const MAX_CACHE_SIZE = 50

const weatherCache = new Map<string, CacheEntry>()

/** 清除全部天气缓存（测试用） */
export function clearWeatherCache(): void {
  weatherCache.clear()
}

/** 从缓存获取天气数据，未命中或已过期时返回 null */
export function getCachedWeather(city: string): null | WeatherResponse {
  const cached = weatherCache.get(city)
  if (!cached)
    return null

  const now = Date.now()
  if (now - cached.timestamp > CACHE_TTL) {
    weatherCache.delete(city)
    return null
  }

  return cached.data
}

/** 获取缓存统计（测试/调试用） */
export function getWeatherCacheStats(): { size: number } {
  return { size: weatherCache.size }
}

/** 将天气数据存入缓存，超出大小限制时清理过期条目 */
export function setCachedWeather(city: string, data: WeatherResponse): void {
  weatherCache.set(city, { data, timestamp: Date.now() })

  // 超出上限时清理过期条目，防止内存泄漏
  if (weatherCache.size > MAX_CACHE_SIZE) {
    const now = Date.now()
    for (const [key, entry] of weatherCache.entries()) {
      if (now - entry.timestamp > CACHE_TTL) {
        weatherCache.delete(key)
      }
    }
  }
}
