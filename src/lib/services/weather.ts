/**
 * 天气服务
 *
 * 采用双通道高可用气象引擎：
 * 1. 优先调用 Open-Meteo 高精度全球/全国地理编码与气象预报 API（完美支持襄阳等全国所有城市/区县）；
 * 2. 备用通道降级至 wttr.in 气象源；
 * 3. 内存级 5 分钟缓存加速。
 */

import { getCachedWeather, setCachedWeather } from '@/lib/weather-cache'

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

const WEATHER_TIMEOUT = 5000

/** WMO (世界气象组织) 标准天气代码到中文描述映射 */
const WMO_CODE_MAP: Record<number, string> = {
  0: '晴',
  1: '多云',
  2: '多云',
  3: '阴',
  45: '雾',
  48: '大雾',
  51: '毛毛雨',
  53: '小雨',
  55: '中雨',
  56: '冻雨',
  57: '冻雨',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨',
  67: '强冻雨',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '冰粒',
  80: '阵雨',
  81: '大阵雨',
  82: '暴雨',
  85: '阵雪',
  86: '大阵雪',
  95: '雷阵雨',
  96: '雷暴大雨',
  99: '雷暴大雪',
}

/** wttr.in 天气代码到中文描述的映射 */
const WTTR_CODE_MAP: Record<number, string> = {
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

/** 清理城市名称后缀以便精准地理编码搜索 */
function normalizeCityName(raw: string): string {
  return raw
    .trim()
    .replace(/(?:市|地区|自治州|盟|壮族自治区|回族自治区|维吾尔自治区|特别行政区)$/g, '')
    .trim() || raw.trim()
}

/** 通道 1: Open-Meteo 高精度气象引擎 */
async function fetchFromOpenMeteo(city: string): Promise<null | WeatherData> {
  const cleanCity = normalizeCityName(city)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT)

  try {
    // 1. 地理编码搜索城市经纬度
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanCity)}&count=1&language=zh&format=json`
    const geoRes = await fetch(geoUrl, { signal: controller.signal })
    if (!geoRes.ok)
      return null

    const geoData = await geoRes.json()
    const spot = geoData.results?.[0]
    if (!spot)
      return null

    const { latitude, longitude } = spot

    // 2. 获取实时天气与 3 日预报
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=3`
    const wRes = await fetch(weatherUrl, { signal: controller.signal })
    if (!wRes.ok)
      return null

    const wData = await wRes.json()
    const current = wData.current
    const daily = wData.daily
    if (!current || !daily)
      return null

    const forecast: WeatherForecast[] = (daily.time || []).slice(0, 3).map((date: string, idx: number) => ({
      date,
      maxTemp: Math.round(daily.temperature_2m_max?.[idx] ?? current.temperature_2m),
      minTemp: Math.round(daily.temperature_2m_min?.[idx] ?? current.temperature_2m),
      weatherCode: Number(daily.weather_code?.[idx] ?? 0),
      weatherDesc: WMO_CODE_MAP[Number(daily.weather_code?.[idx] ?? 0)] || '多云',
    }))

    const weatherCode = Number(current.weather_code)
    return {
      city,
      feelsLike: Math.round(current.apparent_temperature),
      forecast,
      humidity: Math.round(current.relative_humidity_2m),
      temperature: Math.round(current.temperature_2m),
      weatherCode,
      weatherDesc: WMO_CODE_MAP[weatherCode] || '晴',
      windSpeed: Math.round(current.wind_speed_10m),
    }
  }
  catch {
    return null
  }
  finally {
    clearTimeout(timeout)
  }
}

/** 通道 2: wttr.in 备用气象源 */
async function fetchFromWttrIn(city: string): Promise<null | WeatherData> {
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

    const data = await res.json()
    const current = data.current_condition?.[0]
    if (!current)
      return null

    const weatherCode = Number(current.weatherCode)
    const forecast: WeatherForecast[] = (data.weather || []).slice(0, 3).map((day: { date: string, hourly?: Array<{ weatherCode: string }>, maxtempC: string, mintempC: string }) => ({
      date: day.date,
      maxTemp: Number(day.maxtempC),
      minTemp: Number(day.mintempC),
      weatherCode: Number(day.hourly?.[4]?.weatherCode || day.hourly?.[0]?.weatherCode || 0),
      weatherDesc:
        WTTR_CODE_MAP[
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
      weatherDesc: WTTR_CODE_MAP[weatherCode] || current.lang_zh?.[0]?.value || '未知',
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

/** 获取指定城市的实时天气和未来 3 天预报（带多级容灾与缓存） */
async function getWeather(city: string): Promise<null | WeatherData> {
  if (!city || !city.trim())
    return null

  const clean = city.trim()

  // 1. 检查缓存
  const cached = getCachedWeather(clean)
  if (cached) {
    return cached as WeatherData
  }

  // 2. 优先调用 Open-Meteo 高精度接口（覆盖襄阳、大理等全部中国城市）
  let weather = await fetchFromOpenMeteo(clean)

  // 3. 失败时尝试备用 wttr.in
  if (!weather) {
    weather = await fetchFromWttrIn(clean)
  }

  // 4. 成功时存入缓存
  if (weather) {
    setCachedWeather(clean, weather)
  }

  return weather
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
    // WMO codes
    51,
    53,
    55,
    56,
    57,
    61,
    63,
    65,
    66,
    67,
    80,
    81,
    82,
    95,
    96,
    99,
    // wttr.in codes
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

/** 判断当前天气是否适合户外活动（排除雨天和极端温度） */
function isGoodForOutdoor(weather: null | WeatherData): boolean {
  if (!weather)
    return true
  const { temperature, weatherCode } = weather
  const badWeatherCodes = [
    // WMO
    55,
    63,
    65,
    66,
    67,
    73,
    75,
    81,
    82,
    86,
    95,
    96,
    99,
    // wttr.in
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
  if (badWeatherCodes.includes(weatherCode)) {
    return false
  }
  if (temperature > 38 || temperature < -5)
    return false
  return true
}

export { getDressAdvice, getWeather, isGoodForOutdoor }
