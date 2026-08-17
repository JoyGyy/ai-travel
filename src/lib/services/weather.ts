/**
 * 天气服务
 * 调用 wttr.in 免费 API 获取城市实时天气和预报
 */

export interface WeatherData {
  city: string
  feelsLike: number
  forecast: WeatherForecast[]
  humidity: number
  temperature: number
  weatherCode: number
  weatherDesc: string
  windSpeed: number
}

export interface WeatherForecast {
  date: string
  maxTemp: number
  minTemp: number
  weatherCode: number
  weatherDesc: string
}

const WEATHER_TIMEOUT = 15_000

/** wttr.in 天气代码到中文描述的映射 */
const WEATHER_CODE_MAP: Record<number, string> = {
  113: '晴',
  116: '多云',
  119: '阴',
  122: '阴天',
  143: '雾',
  176: '局部小雨',
  179: '局部小雪',
  182: '局部雨夹雪',
  185: '局部冻雨',
  200: '局部雷阵雨',
  227: '小雪',
  230: '暴风雪',
  248: '雾',
  260: '冻雾',
  263: '毛毛雨',
  266: '小雨',
  281: '冻毛毛雨',
  284: '冻雨',
  293: '局部小雨',
  296: '小雨',
  299: '中雨',
  302: '大雨',
  305: '暴雨',
  308: '特大暴雨',
  311: '冻雨',
  314: '大冻雨',
  317: '雨夹雪',
  320: '中雪',
  323: '局部小雪',
  326: '小雪',
  329: '中雪',
  332: '大雪',
  335: '暴雪',
  338: '暴雪',
  350: '冰粒',
  353: '阵雨',
  356: '大阵雨',
  359: '暴雨',
  362: '阵雨夹雪',
  365: '大阵雨夹雪',
  368: '小阵雪',
  371: '大阵雪',
  374: '冰粒',
  377: '冰粒',
  386: '雷阵雨',
  389: '雷暴大雨',
  392: '雷暴雪',
  395: '雷暴大雪',
}

interface WttrInResponse {
  current_condition?: Array<{
    FeelsLikeC: string
    humidity: string
    lang_zh?: Array<{ value: string }>
    temp_C: string
    weatherCode: string
    windspeedKmph: string
  }>
  weather?: Array<{
    date: string
    hourly?: Array<{ weatherCode: string }>
    maxtempC: string
    mintempC: string
  }>
}

/** 根据温度、天气、湿度生成穿衣和出行建议 */
function getDressAdvice(weather: null | WeatherData): string[] {
  if (!weather)
    return []
  const tips: string[] = []
  const { humidity, temperature, weatherCode } = weather

  if (temperature > 30) {
    tips.push('天气炎热，建议穿透气短袖、短裤，注意防晒')
  }
  else if (temperature > 25) {
    tips.push('天气温暖，建议穿轻薄长袖或短袖')
  }
  else if (temperature > 15) {
    tips.push('天气舒适，建议穿长袖外套')
  }
  else if (temperature > 5) {
    tips.push('天气较冷，建议穿厚外套或薄羽绒服')
  }
  else {
    tips.push('天气寒冷，建议穿羽绒服、围巾、手套')
  }

  const rainyCodes = [
    176,
    179,
    200,
    263,
    266,
    293,
    296,
    299,
    302,
    305,
    308,
    353,
    356,
    359,
    386,
    389,
  ]
  if (rainyCodes.includes(weatherCode)) {
    tips.push('有雨，记得携带雨伞或雨衣')
  }

  if (humidity > 80) {
    tips.push('湿度较高，注意防潮')
  }

  return tips
}

/** 获取指定城市的实时天气和未来 3 天预报 */
async function getWeather(city: string): Promise<null | WeatherData> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT)

  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'zh-CN' },
      signal: controller.signal,
    })

    if (!res.ok)
      return null

    const data = (await res.json()) as WttrInResponse
    const current = data.current_condition?.[0]
    if (!current)
      return null

    const weatherCode = Number(current.weatherCode)
    const forecast: WeatherForecast[] = (data.weather || []).slice(0, 3).map(day => ({
      date: day.date,
      maxTemp: Number(day.maxtempC),
      minTemp: Number(day.mintempC),
      weatherCode: Number(day.hourly?.[4]?.weatherCode || day.hourly?.[0]?.weatherCode || 0),
      weatherDesc:
        WEATHER_CODE_MAP[
          Number(day.hourly?.[4]?.weatherCode || day.hourly?.[0]?.weatherCode || 0)
        ] || '未知',
    }))

    return {
      city,
      feelsLike: Number(current.FeelsLikeC),
      forecast,
      humidity: Number(current.humidity),
      temperature: Number(current.temp_C),
      weatherCode,
      weatherDesc: WEATHER_CODE_MAP[weatherCode] || current.lang_zh?.[0]?.value || '未知',
      windSpeed: Number(current.windspeedKmph),
    }
  }
  catch {
    return null
  }
  finally {
    clearTimeout(timeout)
  }
}

/** 判断当前天气是否适合户外活动（排除雨天和极端温度） */
function isGoodForOutdoor(weather: null | WeatherData): boolean {
  if (!weather)
    return true
  const { temperature, weatherCode } = weather
  if (
    [176, 179, 200, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359, 386, 389].includes(
      weatherCode,
    )
  ) {
    return false
  }
  if (temperature > 38 || temperature < -5)
    return false
  return true
}

export { getDressAdvice, getWeather, isGoodForOutdoor }
