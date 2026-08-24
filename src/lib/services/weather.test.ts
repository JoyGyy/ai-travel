import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearWeatherCache } from '@/lib/weather-cache'
import { getDressAdvice, getWeather, isGoodForOutdoor } from './weather'

describe('weather service', () => {
  beforeEach(() => {
    clearWeatherCache()
    vi.restoreAllMocks()
  })

  describe('getDressAdvice', () => {
    it('天气为 null 时返回空数组', () => {
      expect(getDressAdvice(null)).toEqual([])
    })

    it('高温炎热时给出短袖防晒建议', () => {
      const advice = getDressAdvice({
        city: '三亚',
        feelsLike: 35,
        forecast: [],
        humidity: 60,
        temperature: 32,
        weatherCode: 0,
        weatherDesc: '晴',
        windSpeed: 10,
      })
      expect(advice).toContain('天气炎热，建议穿透气短袖、短裤，注意防晒')
    })

    it('下雨时给出带伞建议', () => {
      const advice = getDressAdvice({
        city: '襄阳',
        feelsLike: 22,
        forecast: [],
        humidity: 85,
        temperature: 20,
        weatherCode: 61,
        weatherDesc: '小雨',
        windSpeed: 8,
      })
      expect(advice).toContain('有雨，记得携带雨伞或雨衣')
      expect(advice).toContain('湿度较高，注意防潮')
    })

    it('严寒时给出羽绒服手套建议', () => {
      const advice = getDressAdvice({
        city: '哈尔滨',
        feelsLike: -10,
        forecast: [],
        humidity: 40,
        temperature: -8,
        weatherCode: 71,
        weatherDesc: '小雪',
        windSpeed: 15,
      })
      expect(advice).toContain('天气寒冷，建议穿羽绒服、围巾、手套')
    })
  })

  describe('isGoodForOutdoor', () => {
    it('天气为 null 时默认返回 true', () => {
      expect(isGoodForOutdoor(null)).toBe(true)
    })

    it('晴朗舒适天气适合户外', () => {
      expect(isGoodForOutdoor({
        city: '大理',
        feelsLike: 22,
        forecast: [],
        humidity: 50,
        temperature: 22,
        weatherCode: 0,
        weatherDesc: '晴',
        windSpeed: 5,
      })).toBe(true)
    })

    it('暴雨雷雨天气不适合户外', () => {
      expect(isGoodForOutdoor({
        city: '襄阳',
        feelsLike: 30,
        forecast: [],
        humidity: 90,
        temperature: 28,
        weatherCode: 96,
        weatherDesc: '雷暴大雨',
        windSpeed: 20,
      })).toBe(false)
    })
  })

  describe('getWeather with Domestic Engine', () => {
    it('能够成功通过国内高可用天气引擎查询天气并解析', async () => {
      const mockAsilu = {
        city: '襄阳',
        date: '8月24日',
        update_time: '18:00',
        weather: [
          {
            date: '24日（今天）',
            temp: '30~24℃',
            weather: '晴转多云',
            wind: '东北风',
          },
          {
            date: '25日（明天）',
            temp: '32~25℃',
            weather: '多云',
            wind: '东风',
          },
          {
            date: '26日（后天）',
            temp: '28~22℃',
            weather: '小雨',
            wind: '北风',
          },
        ],
      }

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input)
        if (url.includes('asilu.com')) {
          return {
            json: async () => mockAsilu,
            ok: true,
          } as Response
        }
        return { ok: false } as Response
      })

      const weather = await getWeather('襄阳')
      expect(weather).not.toBeNull()
      expect(weather?.city).toBe('襄阳')
      expect(weather?.temperature).toBe(30)
      expect(weather?.forecast).toHaveLength(3)
      expect(weather?.forecast[0].maxTemp).toBe(30)
      expect(weather?.forecast[0].minTemp).toBe(24)
    })
  })

  describe('getWeather with Open-Meteo', () => {
    it('国内接口失败时能够平滑降级至 Open-Meteo 查询', async () => {
      const mockGeo = {
        results: [
          {
            id: 1790587,
            latitude: 32.0422,
            longitude: 112.14479,
            name: '襄阳',
          },
        ],
      }

      const mockForecast = {
        current: {
          apparent_temperature: 36.5,
          relative_humidity_2m: 78,
          temperature_2m: 30.2,
          weather_code: 96,
          wind_speed_10m: 12,
        },
        daily: {
          temperature_2m_max: [31.5, 33.0, 32.0],
          temperature_2m_min: [25.0, 24.5, 25.2],
          time: ['2026-08-24', '2026-08-25', '2026-08-26'],
          weather_code: [96, 53, 1],
        },
      }

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input)
        if (url.includes('asilu.com')) {
          return { ok: false } as Response
        }
        if (url.includes('geocoding-api.open-meteo.com')) {
          return {
            json: async () => mockGeo,
            ok: true,
          } as Response
        }
        if (url.includes('api.open-meteo.com')) {
          return {
            json: async () => mockForecast,
            ok: true,
          } as Response
        }
        return { ok: false } as Response
      })

      const weather = await getWeather('襄阳')
      expect(weather).not.toBeNull()
      expect(weather?.city).toBe('襄阳')
      expect(weather?.temperature).toBe(30)
      expect(weather?.feelsLike).toBe(37)
      expect(weather?.humidity).toBe(78)
      expect(weather?.weatherDesc).toBe('雷暴大雨')
      expect(weather?.forecast).toHaveLength(3)
      expect(weather?.forecast[0].date).toBe('2026-08-24')
    })
  })

  describe('getWeather offline fallback', () => {
    it('所有外部接口均失败或超时时能够触发智能气候模拟兜底', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network offline'))

      const weather = await getWeather('襄阳')
      expect(weather).not.toBeNull()
      expect(weather?.city).toBe('襄阳')
      expect(weather?.forecast).toHaveLength(3)
      expect(weather?.temperature).toBeGreaterThan(0)
    })
  })
})
