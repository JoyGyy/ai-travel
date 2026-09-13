import attractionsProduct from '@/knowledge/attractions-product.json'

export interface EnrichedSpotInfo {
  address?: string
  city: string
  coverImage: string
  id: string
  name: string
  openingHours: string
  priceText: string
  rating: number
  recommendedDuration: string
  reviewCount: number
  summary: string
  tags: string[]
  ticketType: 'free' | 'paid'
}

interface ProductAttractionItem {
  address?: string
  aliases?: string[]
  city: string
  coverImage: string
  description?: string
  id: string
  name: string
  openingHours?: string
  priceText?: string
  recommendedDuration?: string
  summary?: string
  tags?: string[]
  ticketType?: string
}

const typedAttractions = attractionsProduct as ProductAttractionItem[]

/**
 * 建立高效查找表与模糊匹配
 */
const nameMap = new Map<string, ProductAttractionItem>()
for (const item of typedAttractions) {
  nameMap.set(item.name, item)
  if (item.aliases && Array.isArray(item.aliases)) {
    for (const alias of item.aliases) {
      nameMap.set(alias, item)
    }
  }
}

/**
 * 基于字符串生成稳定的伪随机评分与点评数
 */
function getStableStats(name: string): { rating: number, reviewCount: number } {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i)
    hash |= 0
  }
  const absHash = Math.abs(hash)
  // rating 4.6 ~ 4.9
  const rating = Number((4.6 + (absHash % 4) * 0.1).toFixed(1))
  // reviewCount 200 ~ 999
  const reviewCount = 200 + (absHash % 800)
  return { rating, reviewCount }
}

/**
 * 根据景点名称和城市检索丰富的景点产品信息
 */
export function lookupAttractionInfo(name: string, city = ''): EnrichedSpotInfo {
  const cleanName = name.trim().replace(/^[\d.、\s#*-]+/, '').trim()
  const stableStats = getStableStats(cleanName)

  // 1. 精确匹配
  let match = nameMap.get(cleanName)

  // 2. 包含/被包含匹配
  if (!match) {
    for (const item of typedAttractions) {
      if (city && item.city && item.city !== city) {
        continue
      }
      if (cleanName.includes(item.name) || item.name.includes(cleanName)) {
        match = item
        break
      }
      if (item.aliases?.some(a => cleanName.includes(a) || a.includes(cleanName))) {
        match = item
        break
      }
    }
  }

  // 3. 全局宽松匹配
  if (!match) {
    for (const item of typedAttractions) {
      if (cleanName.includes(item.name) || item.name.includes(cleanName)) {
        match = item
        break
      }
    }
  }

  if (match) {
    return {
      address: match.address || `${match.city}核心景区`,
      city: match.city,
      coverImage: match.coverImage || '/images/attractions/hangzhou/hangzhou-west-lake.webp',
      id: match.id,
      name: match.name,
      openingHours: match.openingHours || '以景区官方公告为准',
      priceText: match.priceText || (match.ticketType === 'free' ? '免费开放' : '收费景区'),
      rating: stableStats.rating,
      recommendedDuration: match.recommendedDuration || '建议玩 1-2 小时',
      reviewCount: stableStats.reviewCount,
      summary: match.summary || `${match.name}是${match.city}著名的文化旅游地标。`,
      tags: match.tags && match.tags.length > 0 ? match.tags : ['必游', '文化', '摄影'],
      ticketType: match.ticketType === 'paid' ? 'paid' : 'free',
    }
  }

  // 兜底默认值
  return {
    address: `${city || '市中心'}特色打卡点`,
    city: city || '热门旅游城市',
    coverImage: '/images/attractions/hangzhou/hangzhou-west-lake.webp',
    id: `custom-spot-${Math.abs(cleanName.length * 31)}`,
    name: cleanName,
    openingHours: '全天开放或以实际为准',
    priceText: '免费或以现场公示为准',
    rating: stableStats.rating,
    recommendedDuration: '建议玩 1-2 小时',
    reviewCount: stableStats.reviewCount,
    summary: `${cleanName}，适合漫步打卡与深度体验。`,
    tags: ['景点', '打卡', '地道体验'],
    ticketType: 'free',
  }
}
