import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 天气查询 Hook
 *
 * 根据城市名调用后端天气接口，返回天气数据、加载状态和错误信息。
 * 内置请求竞态控制（切换城市时自动中止旧请求）和组件卸载时的清理逻辑。
 */
import type { WeatherResponse } from '@/types/api'

import { getWeatherApi } from '@/api/weather'

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

  // --- 组件卸载时中止进行中的请求 ---
  useEffect(
    () => () => {
      abortRef.current?.abort()
    },
    [],
  )

  return { error, fetchWeather, loading, weather }
}
