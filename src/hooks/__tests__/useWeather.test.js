import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useWeather } from '../useWeather'

vi.mock('@/api/weather', () => ({
  getWeatherApi: vi.fn(),
}))

import { getWeatherApi } from '@/api/weather'

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
    getWeatherApi.mockResolvedValue(mockWeather)

    const { result } = renderHook(() => useWeather())

    await act(async () => {
      result.current.fetchWeather('北京')
    })

    expect(result.current.weather).toEqual(mockWeather)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('fetchWeather 失败时更新 error', async () => {
    getWeatherApi.mockRejectedValue(new Error('网络错误'))

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
    expect(getWeatherApi).not.toHaveBeenCalled()
  })
})
