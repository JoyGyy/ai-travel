/**
 * 天气查询 Hook
 * 根据城市名获取天气信息，支持防抖
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WeatherInfo } from '@/types'

interface UseWeatherReturn {
  weather: WeatherInfo | null
  loading: boolean
  error: string | null
  fetchWeather: (city: string) => void
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const fetchWeather = useCallback((city: string) => {
    if (!city) {
      setWeather(null)
      return
    }

    // 中止上一次请求
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    fetch(`/api/weather?city=${encodeURIComponent(city)}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error('查询失败')
        return res.json()
      })
      .then((data: WeatherInfo) => {
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
    return () => { abortRef.current?.abort() }
  }, [])

  return { weather, loading, error, fetchWeather }
}
