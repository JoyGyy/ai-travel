/**
 * 天气查询 Hook
 * 根据城市名获取天气信息
 */
import { getWeatherApi } from '@/api/weather'
import { useCallback, useEffect, useRef, useState } from 'react'

export function useWeather() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const fetchWeather = useCallback((city) => {
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
