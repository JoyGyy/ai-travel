/**
 * useSearchCache Hook
 * 提供带 TTL 的内存缓存，避免重复请求相同数据。
 * 适用于天气查询、景点搜索等场景。
 *
 * @example
 * const { getCachedOrFetch, clearCache } = useSearchCache<WeatherData>({
 *   ttl: 5 * 60 * 1000, // 5 分钟
 *   maxSize: 100, // 最多缓存 100 条
 * })
 *
 * // 使用
 * const weather = await getCachedOrFetch('北京', () => fetchWeather('北京'))
 */
'use client'

import { useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
}

interface UseSearchCacheOptions {
  /** 缓存最大条目数 */
  maxSize?: number
  /** 缓存过期时间（毫秒） */
  ttl?: number
}

/**
 * 搜索缓存 Hook
 * @param options 缓存配置
 * @returns 缓存操作函数
 */
export function useSearchCache<T>(options: UseSearchCacheOptions = {}) {
  const { maxSize = 100, ttl = 5 * 60 * 1000 } = options

  // 使用 ref 保持缓存跨渲染周期
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map())

  /**
   * 生成缓存 key
   */
  const getCacheKey = useCallback((...args: unknown[]): string => JSON.stringify(args), [])

  /**
   * 清理过期缓存
   */
  const cleanupExpired = useCallback(() => {
    const now = Date.now()
    const cache = cacheRef.current

    for (const [key, entry] of cache.entries()) {
      if (now - entry.timestamp > ttl) {
        cache.delete(key)
      }
    }
  }, [ttl])

  /**
   * 确保缓存不超过最大条目数
   */
  const ensureMaxSize = useCallback(() => {
    const cache = cacheRef.current

    if (cache.size > maxSize) {
      // 删除最旧的条目
      const oldestKey = cache.keys().next().value
      if (oldestKey !== undefined) {
        cache.delete(oldestKey)
      }
    }
  }, [maxSize])

  /**
   * 从缓存获取数据，如果不存在或已过期则调用 fetcher
   */
  const getCachedOrFetch = useCallback(
    async (key: string, fetcher: () => Promise<T>): Promise<T> => {
      const cache = cacheRef.current
      const now = Date.now()

      // 检查缓存是否存在且未过期
      const cached = cache.get(key)
      if (cached && now - cached.timestamp < ttl) {
        return cached.data
      }

      // 调用 fetcher 获取新数据
      const data = await fetcher()

      // 存入缓存
      cache.set(key, { data, timestamp: now })

      // 清理过期缓存和超出大小的缓存
      cleanupExpired()
      ensureMaxSize()

      return data
    },
    [ttl, cleanupExpired, ensureMaxSize],
  )

  /**
   * 获取缓存数据（不调用 fetcher）
   */
  const getCached = useCallback(
    (key: string): null | T => {
      const cache = cacheRef.current
      const now = Date.now()

      const cached = cache.get(key)
      if (cached && now - cached.timestamp < ttl) {
        return cached.data
      }

      return null
    },
    [ttl],
  )

  /**
   * 设置缓存数据
   */
  const setCached = useCallback(
    (key: string, data: T): void => {
      const cache = cacheRef.current
      cache.set(key, { data, timestamp: Date.now() })

      cleanupExpired()
      ensureMaxSize()
    },
    [cleanupExpired, ensureMaxSize],
  )

  /**
   * 清除指定 key 的缓存
   */
  const invalidate = useCallback((key: string): void => {
    cacheRef.current.delete(key)
  }, [])

  /**
   * 清除所有缓存
   */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear()
  }, [])

  /**
   * 获取缓存统计信息
   */
  const getStats = useCallback(() => {
    const cache = cacheRef.current
    const now = Date.now()
    let validCount = 0
    let expiredCount = 0

    for (const entry of cache.values()) {
      if (now - entry.timestamp < ttl) {
        validCount++
      } else {
        expiredCount++
      }
    }

    return {
      expired: expiredCount,
      total: cache.size,
      valid: validCount,
    }
  }, [ttl])

  return {
    clearCache,
    getCached,
    getCachedOrFetch,
    getCacheKey,
    getStats,
    invalidate,
    setCached,
  }
}
