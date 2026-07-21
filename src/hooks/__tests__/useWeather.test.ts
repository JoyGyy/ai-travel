import type { WeatherResponse } from '@/types/api'
import { act, renderHook } from '@testing-library/react'

import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as weatherApi from '@/api/weather'

import { useWeather } from '../useWeather'

vi.mock('@/api/weather')

const mockedGetWeatherApi = vi.mocked(weatherApi.getWeatherApi)

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('初始状态为空', () => {
    const { result } = renderHook(() => useWeather())
    expect(result.current.weather).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetchWeather 成功时更新 weather', async () => {
    const mockWeather = { city: '北京', temperature: 25, weatherDesc: '晴' }
    mockedGetWeatherApi.mockResolvedValue(mockWeather as WeatherResponse)

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.fetchWeather('北京')
    })

    expect(result.current.weather).toEqual(mockWeather)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetchWeather 失败时更新 error', async () => {
    mockedGetWeatherApi.mockRejectedValue(new Error('网络错误'))

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.fetchWeather('北京')
    })

    expect(result.current.weather).toBeNull()
    expect(result.current.error).toBe('网络错误')
    expect(result.current.loading).toBe(false)
  })

  it('空城市名时清空 weather', async () => {
    const { result } = renderHook(() => useWeather())

    act(() => {
      result.current.fetchWeather('')
    })

    expect(result.current.weather).toBeNull()
    expect(mockedGetWeatherApi).not.toHaveBeenCalled()
  })
})
