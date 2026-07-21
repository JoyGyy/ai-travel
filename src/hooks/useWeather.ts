/**
 * 天气查询 Hook
 * 根据城市名获取天气信息
 */
import type { WeatherResponse } from '@/types/api'

import { useCallback, useEffect, useRef, useState } from 'react'

import { getWeatherApi } from '@/api/weather'

export function useWeather() {
  const [weather, setWeather] = useState<WeatherResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchWeather = useCallback((city: string) => {
    if (!city) {
      setWeather(null)
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    getWeatherApi(city, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setWeather(data)
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

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  return { weather, loading, error, fetchWeather }
}
