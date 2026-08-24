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
  '襄阳',
  '张家界',
  '黄山',
  '九寨沟',
]

/** 时间段或路线引导词前缀（真实景点位于冒号后） */
const TIME_OR_HEADER_PREFIXES = [
  /详细游览路线/,
  /游览路线/,
  /详细路线/,
  /路线推荐/,
  /打卡路线/,
  /游玩路线/,
  /景点打卡/,
  /游览行程/,
  /行程路线/,
  /^早晨$/,
  /^清晨$/,
  /^上午$/,
  /^中午$/,
  /^下午$/,
  /^傍晚$/,
  /^夜间$/,
  /^晚上$/,
  /^全天$/,
  /^首日$/,
  /^次日$/,
  /^第[一二三四五六七八九十\d]+天$/,
  /^Day\s*\d+$/i,
]

/** 元数据/非景点版块（如：预算、季节、体验、贴士、穿搭等，整行不作为景点提取） */
const META_SECTION_PATTERNS = [
  // 预算与费用
  /预算/,
  /费用/,
  /花费/,
  /花销/,
  /人均/,
  /门票/,
  /价格/,
  /开销/,
  /收费/,
  // 规划与概览
  /核心体验/,
  /核心建议/,
  /行程亮点/,
  /行程概览/,
  /行程规划/,
  /总体规划/,
  /亮点建议/,
  /玩法推荐/,
  /路线特色/,
  /体验/,
  /主题/,
  /概述/,
  /简介/,
  /背景/,
  /总结/,
  /结语/,
  /前言/,
  /说明/,
  /参考/,
  // 季节与时间
  /最佳季节/,
  /最佳时间/,
  /游玩时间/,
  /出行时间/,
  /适合季节/,
  /出游时间/,
  /建议季节/,
  /旅游季节/,
  /推荐季节/,
  /最佳月份/,
  /游玩天数/,
  /行程天数/,
  // 准备与穿搭
  /穿搭建议/,
  /装备清单/,
  /行前准备/,
  /行李准备/,
  /天气情况/,
  /穿衣指南/,
  /防晒/,
  /装备/,
  /打包/,
  /携带/,
  // 交通与出行
  /交通指南/,
  /交通方式/,
  /交通出行/,
  /如何到达/,
  /自驾路线/,
  /乘车路线/,
  /交通建议/,
  /大交通/,
  /市内交通/,
  /接驳/,
  /往返/,
  /租车/,
  /包车/,
  /换乘/,
  // 住宿
  /住宿推荐/,
  /住宿区域/,
  /酒店住宿/,
  /住宿建议/,
  /入住建议/,
  /推荐住宿/,
  /酒店推荐/,
  /民宿推荐/,
  // 贴士与避坑
  /避坑指南/,
  /注意事项/,
  /游玩贴士/,
  /温馨提示/,
  /防坑指南/,
  /特别提醒/,
  /行前须知/,
  /开放时间/,
  /预约方式/,
  /预约建议/,
  /安全提示/,
  // 美食非景点总称
  /地道美食/,
  /美食推荐/,
  /特色美食/,
  /特色小吃/,
  /美食品尝/,
  /美食打卡/,
  /必吃美食/,
  /餐饮推荐/,
  /餐厅推荐/,
]

function isTimeOrHeaderPrefix(name: string): boolean {
  if (!name)
    return false
  return TIME_OR_HEADER_PREFIXES.some(p => p.test(name))
}

function isMetaSection(name: string): boolean {
  if (!name)
    return false
  return META_SECTION_PATTERNS.some(p => p.test(name))
}

/** 提取单个可能包含时间前缀的文本中的真实景点名称 */
function extractSpotCandidate(raw: string): string {
  if (!raw)
    return ''

  const cleaned = raw.replace(/\*\*/g, '').trim()

  // 如果包含冒号（如 "早晨：户部巷" 或 "黄鹤楼：登楼远眺" 或 "1. 预算分配：100元"）
  if (cleaned.includes('：') || cleaned.includes(':')) {
    const parts = cleaned.split(/[：:]/)
    const titlePart = cleanSpotName(parts[0])
    const contentPart = parts.slice(1).join('：').trim()

    // 1. 如果冒号前是元数据/非景点版块（预算、核心体验、最佳季节等），整行废弃
    if (isMetaSection(titlePart)) {
      return ''
    }

    // 2. 如果冒号前是时间段或路线标题前缀（早晨、上午、详细游览路线等），真实景点在冒号后
    if (isTimeOrHeaderPrefix(titlePart)) {
      const candidateAfterColon = cleanSpotName(contentPart.split(/[（(，,。]/)[0])
      return isValidSpotName(candidateAfterColon) ? candidateAfterColon : ''
    }

    // 3. 否则冒号前即为景点名称（如 "黄鹤楼：上午登楼远眺"）
    return isValidSpotName(titlePart) ? titlePart : ''
  }

  // 没有冒号的直接按括号/标点截取
  const candidate = cleanSpotName(cleaned.split(/[（(，,。]/)[0])
  return isValidSpotName(candidate) ? candidate : ''
}

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
        const candidate = extractSpotCandidate(part)
        if (isValidSpotName(candidate) && !spotNameSet.has(candidate)) {
          spotNameSet.add(candidate)
          spots.push({ name: candidate })
        }
      }
    }
  }

  // 4. 如果路线链不足 2 个景点，从专属路线/景点段落或结构列表中提取真实景点
  if (spots.length < 2) {
    for (const line of lines) {
      const trimmed = line.trim()
      let rawContent = ''
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        rawContent = trimmed.slice(2).trim()
      }
      else if (/^\d+[.、]\s*/.test(trimmed)) {
        rawContent = trimmed.replace(/^\d+[.、]\s*/, '').trim()
      }

      if (rawContent) {
        const candidate = extractSpotCandidate(rawContent)
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
  if (!name || name.length < 2 || name.length > 20)
    return false

  if (isMetaSection(name) || isTimeOrHeaderPrefix(name))
    return false

  return true
}
