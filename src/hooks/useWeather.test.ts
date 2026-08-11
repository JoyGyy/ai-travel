import type { WeatherResponse } from '@/types/api'

import { act, renderHook, waitFor } from '@testing-library/react'

import { useWeather } from './useWeather'

// --- Mock API 模块 ---

vi.mock('@/api/weather', () => ({
  getWeatherApi: vi.fn(),
}))

import { getWeatherApi } from '@/api/weather'

const mockWeatherData: WeatherResponse = {
  city: '北京',
  temperature: 25,
  weatherDesc: '晴',
  humidity: 40,
  windSpeed: 10,
}

// --- 测试套件 ---

describe('useWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('初始状态', () => {
    it('weather 应该为 null', () => {
      const { result } = renderHook(() => useWeather())
      expect(result.current.weather).toBeNull()
    })

    it('loading 应该为 false', () => {
      const { result } = renderHook(() => useWeather())
      expect(result.current.loading).toBe(false)
    })

    it('error 应该为 null', () => {
      const { result } = renderHook(() => useWeather())
      expect(result.current.error).toBeNull()
    })
  })

  describe('fetchWeather 成功', () => {
    it('应该设置天气数据并清除 loading', async () => {
      vi.mocked(getWeatherApi).mockResolvedValue(mockWeatherData)

      const { result } = renderHook(() => useWeather())

      act(() => {
        result.current.fetchWeather('北京')
      })

      // 请求发起后 loading 应为 true
      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.weather).toEqual(mockWeatherData)
      expect(result.current.error).toBeNull()
      expect(getWeatherApi).toHaveBeenCalledWith(
        '北京',
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      )
    })
  })

  describe('fetchWeather 失败', () => {
    it('应该设置 error 并清除 loading', async () => {
      vi.mocked(getWeatherApi).mockRejectedValue(new Error('网络错误'))

      const { result } = renderHook(() => useWeather())

      act(() => {
        result.current.fetchWeather('北京')
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBe('网络错误')
      expect(result.current.weather).toBeNull()
    })

    it('无 message 时应该使用默认错误信息', async () => {
      vi.mocked(getWeatherApi).mockRejectedValue(new Error())

      const { result } = renderHook(() => useWeather())

      act(() => {
        result.current.fetchWeather('北京')
      })

      await waitFor(() => {
        expect(result.current.error).toBe('天气查询失败')
      })
    })
  })

  describe('fetchWeather 空城市', () => {
    it('空字符串应该清空天气数据', () => {
      const { result } = renderHook(() => useWeather())

      act(() => {
        result.current.fetchWeather('')
      })

      expect(result.current.weather).toBeNull()
      expect(getWeatherApi).not.toHaveBeenCalled()
    })
  })

  describe('请求竞态控制', () => {
    it('重复调用应该中止前一次请求', async () => {
      // 模拟第一次请求被中止
      vi.mocked(getWeatherApi).mockImplementation((_city, options) => new Promise((_resolve, reject) => {
          const signal = options?.signal
          if (signal?.aborted) {
            const err = new DOMException('The operation was aborted.', 'AbortError')
            reject(err)
            return
          }
          if (signal) {
            signal.addEventListener('abort', () => {
              reject(new DOMException('The operation was aborted.', 'AbortError'))
            })
          }
        }))

      const { result } = renderHook(() => useWeather())

      // 第一次调用
      act(() => {
        result.current.fetchWeather('北京')
      })

      // 第二次调用会中止第一次，第二次返回数据
      vi.mocked(getWeatherApi).mockResolvedValueOnce(mockWeatherData)

      await act(async () => {
        result.current.fetchWeather('上海')
      })

      // AbortError 不应设置到 error 状态
      expect(result.current.error).toBeNull()
    })
  })
})
