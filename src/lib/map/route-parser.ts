/**
 * AI 旅行攻略路线与景点提取解析器
 */

export interface ParsedRouteSpot {
  address?: string
  description?: string
  name: string
  period?: '早晨' | '上午' | '中午' | '下午' | '傍晚' | '夜间' | '全天'
}

export interface ParsedRouteData {
  city: string
  food: string[]
  routeString: string
  spots: ParsedRouteSpot[]
  summary: string
  tips: string[]
  transportMode: 'driving' | 'transit' | 'walking'
}

const COMMON_CITIES = [
  '成都',
  '大理',
  '杭州',
  '西安',
  '北京',
  '上海',
  '重庆',
  '厦门',
  '广州',
  '武汉',
  '青岛',
  '南京',
  '三亚',
  '苏州',
  '长沙',
  '昆明',
  '丽江',
  '桂林',
  '洛阳',
  '敦煌',
]

/**
 * 从 Markdown 文本中提取城市、路线节点、美食与建议
 */
export function parseItineraryFromMarkdown(text: string, defaultCity?: string): ParsedRouteData {
  if (!text) {
    return {
      city: defaultCity || '未知目的地',
      food: [],
      routeString: '',
      spots: [],
      summary: '',
      tips: [],
      transportMode: 'driving',
    }
  }

  // 1. 识别城市
  let detectedCity = defaultCity || ''
  if (!detectedCity) {
    for (const c of COMMON_CITIES) {
      if (text.includes(c)) {
        detectedCity = c
        break
      }
    }
  }
  if (!detectedCity)
    detectedCity = '旅行目的地'

  // 2. 识别交通方式偏好
  let transportMode: 'driving' | 'transit' | 'walking' = 'driving'
  if (text.includes('自驾') || text.includes('租车') || text.includes('环湖') || text.includes('公路')) {
    transportMode = 'driving'
  }
  else if (text.includes('地铁') || text.includes('公交') || text.includes('高铁') || text.includes('大巴')) {
    transportMode = 'transit'
  }
  else if (text.includes('徒步') || text.includes('漫步') || text.includes('步行') || text.includes('骑行')) {
    transportMode = 'walking'
  }

  // 3. 提取路线箭头链 (例如: 大理古城 → 喜洲 → 双廊 → 挖色 → 海东)
  const spotNameSet = new Set<string>()
  const spots: ParsedRouteSpot[] = []

  const lines = text.split('\n')

  for (const line of lines) {
    if (line.includes('→') || line.includes('➔') || line.includes('->') || line.includes('-->') || line.includes('=>')) {
      const parts = line.split(/→|➔|->|-->|=>/)
      for (const part of parts) {
        const cleaned = cleanSpotName(part)
        if (isValidSpotName(cleaned) && !spotNameSet.has(cleaned)) {
          spotNameSet.add(cleaned)
          spots.push({ name: cleaned })
        }
      }
    }
  }

  // 4. 如果路线链不足 2 个景点，从列表项或加粗重点中提取
  if (spots.length < 2) {
    for (const line of lines) {
      const trimmed = line.trim()
      let rawContent = ''
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        rawContent = trimmed.slice(2).trim()
      }
      else if (/^\d+\.\s/.test(trimmed)) {
        rawContent = trimmed.replace(/^\d+\.\s+/, '').trim()
      }

      if (rawContent) {
        const boldMatch = /\*\*([^*]+)\*\*/.exec(rawContent)
        const candidate = cleanSpotName(boldMatch ? boldMatch[1] : rawContent.split(/[：:(（]/)[0])
        if (isValidSpotName(candidate) && !spotNameSet.has(candidate) && spots.length < 8) {
          spotNameSet.add(candidate)
          spots.push({ name: candidate })
        }
      }
    }
  }

  // 5. 提取核心建议/摘要
  let summary = ''
  const summaryMatch = /[^\n]*【(?:核心建议|行程亮点|亮点建议|总体规划|行程规划|核心亮点)[^】]*】[^\n]*\n([\s\S]*?)(?=\n[#*【]|$)/.exec(text)
  if (summaryMatch && summaryMatch[1]) {
    summary = cleanDecorativeText(summaryMatch[1]).slice(0, 160)
  }
  else {
    const cleanLines = text.split('\n')
      .map(l => cleanDecorativeText(l))
      .filter(l => l.length > 15 && !l.startsWith('你是') && !l.startsWith('回答规范'))
    summary = cleanLines[0] ? cleanLines[0].slice(0, 160) : '根据您的偏好精心定制的专属行程方案。'
  }

  // 6. 提取美食推荐
  const food: string[] = []
  const foodMatch = /[^\n]*【(?:地道美食|美食推荐|特色美食|美食品尝|美食打卡|特色小吃)[^】]*】[^\n]*\n([\s\S]*?)(?=\n[#*【]|$)/.exec(text)
  if (foodMatch && foodMatch[1]) {
    const foodItems = foodMatch[1].match(/[*-]\s*([^：:\n]+)/g)
    if (foodItems) {
      for (const item of foodItems) {
        const cleaned = item.replace(/^[*-]\s*/, '').replace(/[*`]/g, '').trim()
        if (cleaned && cleaned.length <= 25 && !food.includes(cleaned)) {
          food.push(cleaned)
        }
      }
    }
  }

  // 7. 提取避坑贴士
  const tips: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('>') || trimmed.includes('💡') || trimmed.includes('贴士') || trimmed.includes('避坑')) {
      const cleanTip = cleanDecorativeText(trimmed).replace(/^[贴士避坑：:\s]+/, '').trim()
      if (cleanTip.length >= 8 && cleanTip.length <= 80 && !tips.includes(cleanTip) && tips.length < 4) {
        tips.push(cleanTip)
      }
    }
  }

  const routeString = spots.map(s => s.name).join(' ➔ ')

  return {
    city: detectedCity,
    food: food.slice(0, 4),
    routeString,
    spots,
    summary,
    tips: tips.slice(0, 3),
    transportMode,
  }
}

function cleanDecorativeText(str: string): string {
  return str
    .replace(/[*#>]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .trim()
}

function cleanSpotName(raw: string): string {
  let cleaned = raw.trim()
  if (cleaned.includes('：') || cleaned.includes(':')) {
    const segments = cleaned.split(/[：:]/)
    cleaned = segments[segments.length - 1]
  }
  return cleaned
    .replace(/^[\u{1F300}-\u{1FAFF}#*`\s\d.、-]+/u, '')
    .replace(/[。，,;:!！?？*`()（）【】]/g, '')
    .replace(/(?:推荐|游览|打卡|出发|到达|前往|建议|游玩)$/, '')
    .trim()
}

function isValidSpotName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 18)
    return false

  const invalidKeywords = [
    '上午',
    '下午',
    '早晨',
    '中午',
    '傍晚',
    '夜间',
    '自驾',
    '住宿',
    '美食',
    '避坑',
    '交通',
    '核心建议',
    '详细游览路线',
    '详细路线',
    '门票',
    '行程',
    '拍照',
    '顺光',
    '顺时针',
    '逆时针',
    '游玩时长',
    '注意事项',
  ]
  if (invalidKeywords.some(k => name === k || name.startsWith(k)))
    return false

  return true
}
