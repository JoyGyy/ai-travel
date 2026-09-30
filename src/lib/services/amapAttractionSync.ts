/**
 * 高德地图开放平台 Web 服务 POI 批量同步引擎
 *
 * 核心功能：
 * 1. 按城市与分类代码（110000 风景名胜 / 110202 国家级景点 / 110201 世界遗产 等）批量拉取当地 TOP 景点 POI；
 * 2. 智能提取高德权威数据：5A/4A 评级、经纬度坐标、实景高清照片、开放时间、评分与详细地址；
 * 3. 自动装配携程开放联盟（u.ctrip.com）门票直达预订链路，实现“高德权威数据 + 携程分销出票”商业闭环；
 * 4. 完善的错误兜底、请求限流与批量城市同步能力。
 */

import { buildCtripTicketLink } from '@/lib/ctrip/alliance'
import type { Attraction, AttractionTicketType } from '@/types/attraction'

export interface AmapPoiPhoto {
  title?: string
  url: string
}

export interface AmapPoiBizExt {
  cost?: string | string[]
  open_time?: string
  opentime2?: string
  rating?: string
  ticket_ordering?: string
}

export interface AmapRawPoi {
  adcode?: string
  adname?: string
  address?: string
  alias?: string | string[]
  biz_ext?: AmapPoiBizExt
  cityname?: string
  distance?: string
  id: string
  keytag?: string
  location?: string // "经度,纬度"
  name: string
  photos?: AmapPoiPhoto[]
  pname?: string
  tel?: string
  type?: string
  typecode?: string
  website?: string
}

export interface AmapPlaceResponse {
  count?: string
  info?: string
  infocode?: string
  pois?: AmapRawPoi[]
  status?: string
}

export interface AmapSyncOptions {
  /** 高德 Web 服务 API Key（若不传默认读取环境变量 AMAP_API_KEY） */
  apiKey?: string
  /** 目标城市名称，如 "杭州"、"成都"、"三亚" */
  city: string
  /** 期望拉取数量，默认 20，最多 50 */
  limit?: number
  /** 页码，默认 1 */
  page?: number
  /**
   * 高德 POI 分类代码，默认为风景名胜核心大类及国家级景点
   * 110202: 国家级景点 / 5A / 4A
   * 110201: 世界遗产
   * 110200: 风景名胜
   * 110101: 公园
   */
  types?: string
}

export interface AmapSyncResult {
  city: string
  count: number
  items: Attraction[]
  totalAvailable: number
}

/** 规范化城市名称，去除后缀（例如 "杭州市" -> "杭州"） */
export function normalizeCityName(cityName: string): string {
  if (!cityName)
    return ''
  return cityName
    .replace(/(?:市|盟|地区|特别行政区)$/, '')
    .trim()
}

/** 城市风景默认兜底封面图库 */
const DEFAULT_CITY_COVERS: Record<string, string> = {
  杭州: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?auto=format&fit=crop&w=1080&q=80',
  成都: 'https://images.unsplash.com/photo-1599571234909-29ed5d1321d6?auto=format&fit=crop&w=1080&q=80',
  三亚: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1080&q=80',
  北京: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1080&q=80',
  西安: 'https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?auto=format&fit=crop&w=1080&q=80',
  上海: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=1080&q=80',
}
const FALLBACK_DEFAULT_COVER = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1080&q=80'

/** 根据城市获取默认兜底图 */
export function getCityDefaultCover(city: string): string {
  const cleanCity = normalizeCityName(city)
  return DEFAULT_CITY_COVERS[cleanCity] || FALLBACK_DEFAULT_COVER
}

function safeString(val: unknown): string {
  if (typeof val === 'string')
    return val.trim()
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string')
    return val[0].trim()
  return ''
}

/** 提取景点的分类标签与等级特征 */
export function extractAmapAttractionTags(poi: AmapRawPoi): string[] {
  const tags = new Set<string>()

  const keytag = safeString(poi.keytag)
  const typeStr = safeString(poi.type)
  const adname = safeString(poi.adname)

  if (keytag.includes('5A') || typeStr.includes('5A')) {
    tags.add('5A景区')
  }
  else if (keytag.includes('4A') || typeStr.includes('4A')) {
    tags.add('4A景区')
  }

  if (typeStr.includes('世界遗产')) {
    tags.add('世界遗产')
  }
  if (typeStr.includes('国家级景点')) {
    tags.add('国家名胜')
  }
  if (typeStr.includes('寺庙') || typeStr.includes('道观')) {
    tags.add('古刹祈福')
  }
  if (typeStr.includes('博物馆') || typeStr.includes('纪念馆')) {
    tags.add('人文历史')
  }
  if (typeStr.includes('公园') || typeStr.includes('自然') || typeStr.includes('海滩') || typeStr.includes('湿地')) {
    tags.add('自然风光')
  }
  if (typeStr.includes('特色街区') || typeStr.includes('步行街')) {
    tags.add('街区打卡')
  }

  if (adname) {
    tags.add(adname)
  }

  // 基础保底标签
  if (tags.size === 0) {
    tags.add('热门景点')
  }

  return Array.from(tags).slice(0, 4)
}

/** 推断门票类型与价格文案 */
export function inferTicketPrice(poi: AmapRawPoi): { priceText: string, ticketType: AttractionTicketType } {
  const rawCost = Array.isArray(poi.biz_ext?.cost) ? poi.biz_ext.cost[0] : poi.biz_ext?.cost
  const cost = typeof rawCost === 'string' ? rawCost : ''
  const numCost = cost ? Number.parseFloat(cost) : 0

  if (numCost > 0) {
    return {
      priceText: `约¥${numCost}/人`,
      ticketType: 'paid',
    }
  }

  const name = safeString(poi.name)
  const keytag = safeString(poi.keytag)
  const isFreeSpot = name.includes('西湖') || name.includes('外滩') || keytag.includes('免费') || keytag.includes('城市广场')

  if (isFreeSpot) {
    return {
      priceText: '免费开放',
      ticketType: 'free',
    }
  }

  return {
    priceText: '以携程官方实时报价为准',
    ticketType: 'paid',
  }
}

/**
 * 将高德 POI 格式化转换为系统标准 Attraction 数据模型
 */
export function transformAmapPoiToAttraction(poi: AmapRawPoi, fallbackCity: string): Attraction {
  const rawCity = safeString(poi.cityname) || fallbackCity
  const city = normalizeCityName(rawCity)
  const id = `amap_${safeString(poi.id).toLowerCase() || Math.random().toString(36).slice(2)}`
  const name = safeString(poi.name)

  // 提取封面图（优先采用高德官方实景图）
  let coverImage = getCityDefaultCover(city)
  if (Array.isArray(poi.photos) && poi.photos.length > 0 && typeof poi.photos[0]?.url === 'string') {
    coverImage = poi.photos[0].url.replace(/^http:\/\//, 'https://')
  }

  const tags = extractAmapAttractionTags(poi)
  const { priceText, ticketType } = inferTicketPrice(poi)

  // 开放时间提取
  const rawOpening = poi.biz_ext?.opentime2 || poi.biz_ext?.open_time || '详见景区官方当日公示'
  const openingHours = typeof rawOpening === 'string' ? rawOpening.replace(/；/g, '；\n') : '详见景区官方当日公示'

  // 地址与评分
  const rawAddress = safeString(poi.address)
  const adname = safeString(poi.adname)
  const address = rawAddress || (adname ? `${city}${adname}` : `${city}风景区`)
  const ratingText = poi.biz_ext?.rating ? `高德评分 ${poi.biz_ext.rating} 分` : '广受好评'

  // 组装亮点
  const highlights: string[] = []
  const keytag = safeString(poi.keytag)
  if (keytag) {
    highlights.push(keytag)
  }
  if (poi.biz_ext?.rating) {
    highlights.push(`综合口碑评级 ${poi.biz_ext.rating} 分`)
  }
  if (tags.length > 0) {
    highlights.push(tags.join(' · '))
  }

  const summary = `${city}${name}，${ratingText}，位于${address}。`
  const description = `${name}是位于${city}的代表性热门旅游胜地。这里汇聚了丰富的观光资源与特色体验，适合休闲度假、拍照打卡与深度人文探索。`

  // 自动装配携程联盟官方直达购票链路
  const ctripBookingLink = buildCtripTicketLink({
    city,
    spotName: name,
  })

  // 别名提取（安全处理数组或竖线分隔字符串）
  const aliases: string[] = []
  if (typeof poi.alias === 'string' && poi.alias.trim()) {
    aliases.push(...poi.alias.split('|').filter(Boolean))
  }
  else if (Array.isArray(poi.alias)) {
    aliases.push(...poi.alias.filter(item => typeof item === 'string' && item.trim()))
  }

  return {
    address,
    aliases,
    bookingLinks: {
      ctrip: ctripBookingLink,
    },
    city,
    coverImage,
    description,
    highlights: highlights.length > 0 ? highlights : ['自然人文兼备', '核心地标'],
    id,
    name,
    openingHours,
    priceText,
    recommendedDuration: tags.includes('5A景区') ? '半天至1天' : '2-3小时',
    suitableFor: ['情侣出行', '家庭亲子', '好友结伴', '摄影打卡'],
    summary,
    tags,
    ticketType,
    tips: [
      '建议提前在携程预约购票，避免现场排队排期。',
      '入园请携带有效身份证件及实时电子凭证。',
      '热门游览季节建议错峰出行，体验更佳。',
    ],
  }
}

/**
 * 核心函数：根据指定城市批量拉取高德热门景点列表
 */
export async function fetchAmapAttractionsByCity(
  options: AmapSyncOptions,
): Promise<AmapSyncResult> {
  const {
    city,
    limit = 20,
    page = 1,
    types = '110202|110201|110200|110101|110000',
  } = options

  const apiKey = options.apiKey || process.env.AMAP_API_KEY
  if (!apiKey) {
    throw new Error('缺少 AMAP_API_KEY 配置，请在 .env 中设置有效的高德地图 API Key')
  }

  const cleanCity = normalizeCityName(city)
  const offset = Math.min(Math.max(limit, 1), 50)

  const url = new URL('https://restapi.amap.com/v3/place/text')
  url.searchParams.set('key', apiKey)
  url.searchParams.set('types', types)
  url.searchParams.set('city', cleanCity)
  url.searchParams.set('citylimit', 'true')
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('page', String(page))
  url.searchParams.set('extensions', 'all')

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  })

  if (!response.ok) {
    throw new Error(`高德 API 网络响应失败: HTTP ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as AmapPlaceResponse

  if (data.status !== '1' || data.infocode !== '10000') {
    throw new Error(`高德 POI 检索返回错误: [${data.infocode || '未知'}] ${data.info || '查询失败'}`)
  }

  const rawPois = Array.isArray(data.pois) ? data.pois : []
  const totalAvailable = Number.parseInt(data.count || '0', 10) || rawPois.length

  const items = rawPois.map(poi => transformAmapPoiToAttraction(poi, cleanCity))

  return {
    city: cleanCity,
    count: items.length,
    items,
    totalAvailable,
  }
}

/**
 * 批量同步多个城市的景点列表
 * 内置防限流延迟机制，防止触发高德 QPS 限制
 */
export async function batchSyncAmapCities({
  apiKey,
  cities,
  limitPerCity = 20,
  types,
}: {
  apiKey?: string
  cities: string[]
  limitPerCity?: number
  types?: string
}): Promise<{
  errors: { city: string, error: string }[]
  results: Record<string, Attraction[]>
  totalCount: number
}> {
  const results: Record<string, Attraction[]> = {}
  const errors: { city: string, error: string }[] = []
  let totalCount = 0

  for (const city of cities) {
    try {
      const res = await fetchAmapAttractionsByCity({
        apiKey,
        city,
        limit: limitPerCity,
        types,
      })
      results[res.city] = res.items
      totalCount += res.items.length

      // 友好延时 200ms 防频控
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({ city, error: message })
    }
  }

  return {
    errors,
    results,
    totalCount,
  }
}
