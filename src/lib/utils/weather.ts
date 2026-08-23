/**
 * 天气查询工具函数
 */

/** 最近搜索本地存储键 */
const RECENT_KEY = 'weather-recent-cities'
const MAX_RECENT = 6

/** 获取最近搜索的城市列表 */
export function getRecentCities(): string[] {
  if (typeof window === 'undefined')
    return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  }
  catch {
    return []
  }
}

/** 保存最近搜索的城市 */
export function saveRecentCity(city: string) {
  const recent = getRecentCities().filter(c => c !== city)
  recent.unshift(city)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}

/** 天气小贴士项 */
export interface WeatherTip {
  text: string
  title: string
}

/** 根据天气生成小贴士 */
export function getWeatherTips(temp: number, desc: string, humidity: number, uv?: number): WeatherTip[] {
  const tips: WeatherTip[] = []

  // 穿衣建议
  if (temp >= 30) {
    tips.push({ text: '建议穿短袖、短裤，注意防暑防晒', title: '穿衣建议' })
  }
  else if (temp >= 20) {
    tips.push({ text: '薄外套或长袖，早晚温差注意添衣', title: '穿衣建议' })
  }
  else if (temp >= 10) {
    tips.push({ text: '建议穿夹克、毛衣，注意保暖', title: '穿衣建议' })
  }
  else {
    tips.push({ text: '厚外套、羽绒服必备，注意防寒', title: '穿衣建议' })
  }

  // 出行建议
  if (desc.includes('雨')) {
    tips.push({ text: '记得带伞，路面湿滑注意安全', title: '出行提醒' })
  }
  else if (desc.includes('雪')) {
    tips.push({ text: '注意防滑，驾车请减速慢行', title: '出行提醒' })
  }
  else if (desc.includes('晴')) {
    tips.push({ text: '天气晴好，适合户外活动', title: '出行提醒' })
  }

  // 湿度建议
  if (humidity >= 80) {
    tips.push({ text: '湿度较高，注意防潮除湿', title: '湿度提醒' })
  }
  else if (humidity <= 30) {
    tips.push({ text: '空气干燥，多补充水分', title: '湿度提醒' })
  }

  // 紫外线
  if (uv && uv >= 6) {
    tips.push({ text: '紫外线较强，外出请涂防晒霜', title: '防晒提醒' })
  }

  return tips
}
