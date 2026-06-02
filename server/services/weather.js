/**
 * 天气服务
 * 调用 wttr.in 免费 API 获取城市实时天气和预报
 */

/** 天气请求超时时间 */
const WEATHER_TIMEOUT = 15_000

/** 天气代码映射表（wttr.in weatherCode → 中文描述） */
const WEATHER_CODE_MAP = {
  113: '晴', 116: '多云', 119: '阴', 122: '阴天',
  143: '雾', 176: '局部小雨', 179: '局部小雪', 182: '局部雨夹雪',
  185: '局部冻雨', 200: '局部雷阵雨', 227: '小雪', 230: '暴风雪',
  248: '雾', 260: '冻雾', 263: '毛毛雨', 266: '小雨',
  281: '冻毛毛雨', 284: '冻雨', 293: '局部小雨', 296: '小雨',
  299: '中雨', 302: '大雨', 305: '暴雨', 308: '特大暴雨',
  311: '冻雨', 314: '大冻雨', 317: '雨夹雪', 320: '中雪',
  323: '局部小雪', 326: '小雪', 329: '中雪', 332: '大雪',
  335: '暴雪', 338: '暴雪', 350: '冰粒', 353: '阵雨',
  356: '大阵雨', 359: '暴雨', 362: '阵雨夹雪', 365: '大阵雨夹雪',
  368: '小阵雪', 371: '大阵雪', 374: '冰粒', 377: '冰粒',
  386: '雷阵雨', 389: '雷暴大雨', 392: '雷暴雪', 395: '雷暴大雪',
}

/**
 * 获取城市天气信息
 * @param {string} city - 城市名称（中文）
 * @returns {Promise<object|null>} 天气数据或 null（请求失败时）
 */
async function getWeather(city) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), WEATHER_TIMEOUT)

  try {
    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'zh-CN' },
    })

    if (!res.ok) return null

    const data = await res.json()
    const current = data.current_condition?.[0]
    if (!current) return null

    const weatherCode = Number(current.weatherCode)
    const forecast = (data.weather || []).slice(0, 3).map(day => ({
      date: day.date,
      maxTemp: Number(day.maxtempC),
      minTemp: Number(day.mintempC),
      weatherCode: Number(day.hourly?.[4]?.weatherCode || day.hourly?.[0]?.weatherCode || 0),
      weatherDesc: WEATHER_CODE_MAP[Number(day.hourly?.[4]?.weatherCode || day.hourly?.[0]?.weatherCode || 0)] || '未知',
    }))

    return {
      city,
      temperature: Number(current.temp_C),
      feelsLike: Number(current.FeelsLikeC),
      humidity: Number(current.humidity),
      windSpeed: Number(current.windspeedKmph),
      weatherCode,
      weatherDesc: WEATHER_CODE_MAP[weatherCode] || current.lang_zh?.[0]?.value || '未知',
      forecast,
    }
  }
  catch {
    return null
  }
  finally {
    clearTimeout(timeout)
  }
}

/**
 * 根据天气判断是否适合户外活动
 * @param {object} weather - 天气数据
 * @returns {boolean}
 */
function isGoodForOutdoor(weather) {
  if (!weather) return true
  const { temperature, weatherCode } = weather
  // 雨雪天气不适合户外
  if ([176, 179, 200, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359, 386, 389].includes(weatherCode)) return false
  // 极端温度不适合
  if (temperature > 38 || temperature < -5) return false
  return true
}

/**
 * 根据天气生成穿衣建议
 * @param {object} weather - 天气数据
 * @returns {string[]}
 */
function getDressAdvice(weather) {
  if (!weather) return []
  const tips = []
  const { temperature, weatherCode, humidity } = weather

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

  const rainyCodes = [176, 179, 200, 263, 266, 293, 296, 299, 302, 305, 308, 353, 356, 359, 386, 389]
  if (rainyCodes.includes(weatherCode)) {
    tips.push('有雨，记得携带雨伞或雨衣')
  }

  if (humidity > 80) {
    tips.push('湿度较高，注意防潮')
  }

  return tips
}

module.exports = { getWeather, isGoodForOutdoor, getDressAdvice }
