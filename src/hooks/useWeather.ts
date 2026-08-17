/**
 * 天气查询 Hook
 *
 * 根据城市名调用后端天气接口，返回天气数据、加载状态和错误信息。
 * 内置请求竞态控制（切换城市时自动中止旧请求）和组件卸载时的清理逻辑。
 * 集成 5 分钟内存缓存，避免重复请求相同城市的天气数据。
 */
import type { WeatherResponse } from '@/types/api'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getWeatherApi } from '@/api/weather'
import { clearWeatherCache, getCachedWeather, setCachedWeather } from '@/lib/weather-cache'

export function useWeather() {
  const [weather, setWeather] = useState<null | WeatherResponse>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchWeather = useCallback((city: string) => {
    if (!city) {
      setWeather(null)
      return
    }

    // 命中缓存时直接返回，不发请求
    const cached = getCachedWeather(city)
    if (cached) {
      setWeather(cached)
      setError(null)
      return
    }

    // 中止之前的请求，避免竞态
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    getWeatherApi(city, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setWeather(data)
          if (data) {
            setCachedWeather(city, data) // 存入缓存
          }
          setLoading(false)
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setError(err.message || '天气查询失败')
          setLoading(false)
        }
      })
  }, [])

  /**
   * 清除天气缓存（如切换用户或手动刷新时）
   */
  const clearCache = useCallback(() => {
    clearWeatherCache()
  }, [])

  // --- 组件卸载时中止进行中的请求 ---
  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  return { clearCache, error, fetchWeather, loading, weather }
}
