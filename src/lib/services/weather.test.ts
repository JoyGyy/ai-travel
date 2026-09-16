import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

  describe('getWeather with Amap', () => {
    const originalAmapKey = process.env.AMAP_API_KEY

    afterEach(() => {
      process.env.AMAP_API_KEY = originalAmapKey
    })

    it('配置高德 Key 时优先调用高德天气 API', async () => {
      process.env.AMAP_API_KEY = 'test-amap-key'

      const mockAmapResponse = {
        forecasts: [
          {
            adcode: '330100',
            casts: [
              {
                date: '2026-09-16',
                daytemp: '28',
                dayweather: '晴',
                nighttemp: '18',
                nightweather: '晴',
              },
              {
                date: '2026-09-17',
                daytemp: '26',
                dayweather: '多云',
                nighttemp: '17',
                nightweather: '阴',
              },
              {
                date: '2026-09-18',
                daytemp: '24',
                dayweather: '小雨',
                nighttemp: '19',
                nightweather: '小雨',
              },
            ],
            city: '杭州市',
            province: '浙江',
            reporttime: '2026-09-16 11:30:00',
          },
        ],
        infocode: '10000',
        status: '1',
      }

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input)
        if (url.includes('restapi.amap.com/v3/weather/weatherInfo')) {
          return {
            json: async () => mockAmapResponse,
            ok: true,
          } as Response
        }
        return { ok: false } as Response
      })

      const weather = await getWeather('杭州')
      expect(weather).not.toBeNull()
      expect(weather?.city).toBe('杭州')
      expect(weather?.temperature).toBe(23)
      expect(weather?.weatherDesc).toBe('晴')
      expect(weather?.forecast).toHaveLength(3)
      expect(weather?.forecast[0].date).toBe('2026-09-16')
      expect(weather?.forecast[0].maxTemp).toBe(28)
      expect(weather?.forecast[0].minTemp).toBe(18)
    })

    it('高德接口异常时能够平滑降级至 Asilu 接口查询', async () => {
      process.env.AMAP_API_KEY = 'test-amap-key'

      const mockAsilu = {
        weather: [
          {
            date: '16日（今天）',
            temp: '28~18℃',
            weather: '晴',
          },
          {
            date: '17日（明天）',
            temp: '26~17℃',
            weather: '多云',
          },
          {
            date: '18日（后天）',
            temp: '24~19℃',
            weather: '小雨',
          },
        ],
      }

      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = String(input)
        if (url.includes('restapi.amap.com/v3/weather/weatherInfo')) {
          return { ok: false } as Response
        }
        if (url.includes('asilu.com')) {
          return {
            json: async () => mockAsilu,
            ok: true,
          } as Response
        }
        return { ok: false } as Response
      })

      const weather = await getWeather('杭州')
      expect(weather).not.toBeNull()
      expect(weather?.city).toBe('杭州')
      expect(weather?.temperature).toBe(28)
      expect(weather?.forecast).toHaveLength(3)
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
