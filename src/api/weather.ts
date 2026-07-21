import type { WeatherResponse } from '@/types/api'

import { request } from './client'

export function getWeatherApi(city: string, options: { signal?: AbortSignal } = {}): Promise<WeatherResponse | null> {
  return request<WeatherResponse | null>(`/api/weather?city=${encodeURIComponent(city)}`, {
    signal: options.signal,
  })
}
