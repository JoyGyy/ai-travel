/**
 * 携程开放联盟 (u.ctrip.com / alliance.ctrip.com) 统一分销与深度跳转引擎
 *
 * 核心规范：
 * - allianceid: 联盟合作方 ID (从 NEXT_PUBLIC_CTRIP_ALLIANCE_ID 读取，默认兜底)
 * - sid: 子渠道推广位 ID (从 NEXT_PUBLIC_CTRIP_SID 读取，或按场景细分)
 * - ouid: 用户标识 (可选，用于追踪特定用户维度的转化分析)
 */

export const DEFAULT_CTRIP_ALLIANCE_ID = '4897000'
export const DEFAULT_CTRIP_SID = 'ai_travel_planner'

export interface CtripCommonOptions {
  allianceid?: string
  ouid?: string
  sid?: string
}

export interface CtripTicketOptions extends CtripCommonOptions {
  city?: string
  spotName: string
}

export interface CtripHotelOptions extends CtripCommonOptions {
  checkInDate?: string // YYYY-MM-DD
  checkOutDate?: string // YYYY-MM-DD
  city?: string
  keyword?: string // 酒店名称或商圈地标 (如 "锦里"、"春熙路")
}

export interface CtripTrainOptions extends CtripCommonOptions {
  arrival: string // 到达城市/车站 (如 "成都" 或 "成都东")
  date?: string // 出行日期 YYYY-MM-DD
  departure: string // 出发城市/车站 (如 "北京" 或 "北京西")
}

export interface CtripFlightOptions extends CtripCommonOptions {
  arrival: string
  date?: string
  departure: string
}

export interface CtripCarOptions extends CtripCommonOptions {
  city?: string
}

/**
 * 获取当前环境生效的携程联盟基础配置
 */
export function getCtripAllianceConfig(customOptions?: CtripCommonOptions): {
  allianceid: string
  ouid?: string
  sid: string
} {
  const envAllianceId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CTRIP_ALLIANCE_ID : undefined
  const envSid = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CTRIP_SID : undefined

  return {
    allianceid: customOptions?.allianceid || envAllianceId || DEFAULT_CTRIP_ALLIANCE_ID,
    ouid: customOptions?.ouid,
    sid: customOptions?.sid || envSid || DEFAULT_CTRIP_SID,
  }
}

/**
 * 将携程联盟追踪参数追加到目标 URL
 */
export function attachCtripAllianceParams(
  targetUrl: string,
  options?: CtripCommonOptions,
): string {
  try {
    const config = getCtripAllianceConfig(options)
    const url = new URL(targetUrl)

    if (config.allianceid && !url.searchParams.has('allianceid')) {
      url.searchParams.set('allianceid', config.allianceid)
    }
    if (config.sid && !url.searchParams.has('sid')) {
      url.searchParams.set('sid', config.sid)
    }
    if (config.ouid && !url.searchParams.has('ouid')) {
      url.searchParams.set('ouid', config.ouid)
    }

    return url.toString()
  }
  catch {
    // 若 targetUrl 相对路径解析失败，做简易字符串拼接兼容
    const config = getCtripAllianceConfig(options)
    const delimiter = targetUrl.includes('?') ? '&' : '?'
    const queryParts = [
      `allianceid=${encodeURIComponent(config.allianceid)}`,
      `sid=${encodeURIComponent(config.sid)}`,
    ]
    if (config.ouid) {
      queryParts.push(`ouid=${encodeURIComponent(config.ouid)}`)
    }
    return `${targetUrl}${delimiter}${queryParts.join('&')}`
  }
}

/**
 * 1. 景点门票 / 景区特惠预订链接生成器
 * 落地携程移动端门票直达页，支持带景点名称与所在城市
 */
export function buildCtripTicketLink({
  city,
  spotName,
  ...options
}: CtripTicketOptions): string {
  const config = getCtripAllianceConfig({
    sid: 'attraction_ticket',
    ...options,
  })

  const queryTerm = [city, spotName].filter(Boolean).join(' ').trim()
  const encodedKeyword = encodeURIComponent(queryTerm || spotName)

  const url = new URL('https://m.ctrip.com/webapp/ticket/ticketdetail/search.html')
  url.searchParams.set('keyword', decodeURIComponent(encodedKeyword))
  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 2. 酒店住宿 / 周边高分民宿预订链接生成器
 * 落地携程移动端酒店列表搜索，支持商圈、地标与入住日期
 */
export function buildCtripHotelLink({
  checkInDate,
  checkOutDate,
  city,
  keyword,
  ...options
}: CtripHotelOptions): string {
  const config = getCtripAllianceConfig({
    sid: 'hotel_recommend',
    ...options,
  })

  const url = new URL('https://m.ctrip.com/webapp/hotel/hotellist')

  if (city) {
    url.searchParams.set('cityName', city)
  }
  if (keyword) {
    url.searchParams.set('keywords', keyword)
  }
  if (checkInDate) {
    url.searchParams.set('checkInDate', checkInDate)
  }
  if (checkOutDate) {
    url.searchParams.set('checkOutDate', checkOutDate)
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 3. 高铁 / 火车票直达代订查询链接生成器
 * 落地携程火车票站到站查询页，支持出发城市、到达城市与出发日期
 */
export function buildCtripTrainLink({
  arrival,
  date,
  departure,
  ...options
}: CtripTrainOptions): string {
  const config = getCtripAllianceConfig({
    sid: 'train_ticket',
    ...options,
  })

  const url = new URL('https://m.ctrip.com/webapp/train/')
  url.searchParams.set('dStation', departure)
  url.searchParams.set('aStation', arrival)

  if (date) {
    url.searchParams.set('date', date)
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 4. 国内机票特惠比价直达链接生成器
 */
export function buildCtripFlightLink({
  arrival,
  date,
  departure,
  ...options
}: CtripFlightOptions): string {
  const config = getCtripAllianceConfig({
    sid: 'flight_ticket',
    ...options,
  })

  const url = new URL('https://m.ctrip.com/webapp/flight/index.html')
  url.searchParams.set('dcity', departure)
  url.searchParams.set('acity', arrival)

  if (date) {
    url.searchParams.set('ddate', date)
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 5. 携程用车 / 租车自驾直达链接生成器
 */
export function buildCtripCarLink({
  city,
  ...options
}: CtripCarOptions): string {
  const config = getCtripAllianceConfig({
    sid: 'car_rental',
    ...options,
  })

  const url = new URL('https://m.ctrip.com/webapp/car/index')
  if (city) {
    url.searchParams.set('city', city)
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

