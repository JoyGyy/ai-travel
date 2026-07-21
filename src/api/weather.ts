/**
 * 天气相关 API
 *
 * 根据城市名称查询实时天气数据。
 */
import type { WeatherResponse } from '@/types/api'

import { request } from './client'

/** 查询指定城市的实时天气，支持 AbortSignal 取消 */
export function getWeatherApi(city: string, options: { signal?: AbortSignal } = {}): Promise<WeatherResponse | null> {
  return request<WeatherResponse | null>(`/api/weather?city=${encodeURIComponent(city)}`, {
    signal: options.signal,
  })
}
