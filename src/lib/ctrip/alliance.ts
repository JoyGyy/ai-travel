/**
 * 携程开放联盟 (u.ctrip.com / alliance.ctrip.com) 统一分销与设备自适应分发引擎
 *
 * 核心特性：
 * 1. 设备自适应分发（Device Adaptive Dispatch）：
 *    - 移动端 (Mobile/Tablet)：分发至 m.ctrip.com，适配触屏交互并支持 Universal Links 唤起携程旅行 App；
 *    - 电脑端 (PC Desktop)：分发至 ctrip.com 各业务宽屏官网（you.ctrip.com、hotels.ctrip.com、trains.ctrip.com等），视野广阔；
 * 2. 联盟全渠道归因：
 *    - allianceid: 联盟合作方 ID (从 NEXT_PUBLIC_CTRIP_ALLIANCE_ID 读取，默认兜底)
 *    - sid: 子渠道推广位 ID (从 NEXT_PUBLIC_CTRIP_SID 读取，或按场景细分)
 *    - ouid: 用户标识 (可选，用于追踪特定用户维度的转化分析)
 */

import { useEffect, useState } from 'react'

export const DEFAULT_CTRIP_ALLIANCE_ID = '4897000'
export const DEFAULT_CTRIP_SID = 'ai_travel_planner'

export type CtripDeviceTarget = 'auto' | 'mobile' | 'pc'

export interface CtripCommonOptions {
  allianceid?: string
  device?: CtripDeviceTarget
  ouid?: string
  sid?: string
  userAgent?: string
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
 * 判断当前是否处于移动端设备环境（手机 / 平板）
 */
export function isMobileDevice(userAgent?: string): boolean {
  if (userAgent) {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(userAgent)
  }
  if (typeof window !== 'undefined') {
    if (window.innerWidth > 0 && window.innerWidth < 1024) {
      return true
    }
    const ua = navigator.userAgent || ''
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua)
  }
  // 服务端静态渲染默认以 PC 宽屏为基准
  return false
}

/**
 * 解析实际生效的设备分发目标
 */
export function resolveEffectiveDevice(
  device?: CtripDeviceTarget,
  userAgent?: string,
): 'mobile' | 'pc' {
  if (device === 'mobile')
    return 'mobile'
  if (device === 'pc')
    return 'pc'
  return isMobileDevice(userAgent) ? 'mobile' : 'pc'
}

/**
 * React 自适应设备监听 Hook
 * 在客户端随视口缩放与设备环境动态切换 'mobile' | 'pc' 状态
 */
export function useCtripDevice(): 'mobile' | 'pc' {
  const [device, setDevice] = useState<'mobile' | 'pc'>('pc')

  useEffect(() => {
    function updateDevice() {
      setDevice(isMobileDevice() ? 'mobile' : 'pc')
    }
    updateDevice()
    window.addEventListener('resize', updateDevice)
    return () => window.removeEventListener('resize', updateDevice)
  }, [])

  return device
}

/**
 * 获取当前环境生效的携程联盟基础配置
 */
export function getCtripAllianceConfig(customOptions?: CtripCommonOptions): {
  allianceid: string
  device: 'mobile' | 'pc'
  ouid?: string
  sid: string
} {
  const envAllianceId = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CTRIP_ALLIANCE_ID : undefined
  const envSid = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_CTRIP_SID : undefined

  return {
    allianceid: customOptions?.allianceid || envAllianceId || DEFAULT_CTRIP_ALLIANCE_ID,
    device: resolveEffectiveDevice(customOptions?.device, customOptions?.userAgent),
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
    if (config.ouid) {
      url.searchParams.set('ouid', config.ouid)
    }

    return url.toString()
  }
  catch {
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
 * 1. 景点门票 / 景区特惠预订链接自适应生成器
 * - 移动端：落地 m.ctrip.com 门票搜索直达页（支持触屏购买与 App 唤起）；
 * - PC 桌面端：落地 you.ctrip.com 宽屏攻略与门票目的地搜索页。
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

  let url: URL
  if (config.device === 'mobile') {
    url = new URL('https://m.ctrip.com/webapp/ticket/ticketdetail/search.html')
    url.searchParams.set('keyword', decodeURIComponent(encodedKeyword))
  }
  else {
    url = new URL('https://you.ctrip.com/searchsite/district.html')
    url.searchParams.set('query', decodeURIComponent(encodedKeyword))
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 2. 酒店住宿 / 周边高分民宿预订链接自适应生成器
 * - 移动端：落地 m.ctrip.com 移动端商圈酒店列表；
 * - PC 桌面端：落地 hotels.ctrip.com 宽屏多维度比价列表。
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

  const searchKeyword = keyword || (city ? `${city}热门酒店` : '精选酒店')

  let url: URL
  if (config.device === 'mobile') {
    url = new URL('https://m.ctrip.com/webapp/hotel/hotellist')
    if (city) {
      url.searchParams.set('cityName', city)
    }
    url.searchParams.set('keywords', searchKeyword)
    if (checkInDate) {
      url.searchParams.set('checkInDate', checkInDate)
    }
    if (checkOutDate) {
      url.searchParams.set('checkOutDate', checkOutDate)
    }
  }
  else {
    url = new URL('https://hotels.ctrip.com/hotels/list')
    url.searchParams.set('keyword', searchKeyword)
    if (city) {
      url.searchParams.set('city', city)
    }
    if (checkInDate) {
      url.searchParams.set('checkin', checkInDate)
    }
    if (checkOutDate) {
      url.searchParams.set('checkout', checkOutDate)
    }
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 3. 高铁 / 火车票直达代订查询链接自适应生成器
 * - 移动端：落地 m.ctrip.com 火车票搜索直达；
 * - PC 桌面端：落地 trains.ctrip.com 宽屏车次时刻表与席别查询。
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

  let url: URL
  if (config.device === 'mobile') {
    url = new URL('https://m.ctrip.com/webapp/train/')
    url.searchParams.set('dStation', departure)
    url.searchParams.set('aStation', arrival)
    if (date) {
      url.searchParams.set('date', date)
    }
  }
  else {
    url = new URL('https://trains.ctrip.com/pages/booking/search')
    url.searchParams.set('dStation', departure)
    url.searchParams.set('aStation', arrival)
    if (date) {
      url.searchParams.set('date', date)
    }
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 4. 国内机票特惠比价直达链接自适应生成器
 * - 移动端：落地 m.ctrip.com 特价机票频道；
 * - PC 桌面端：落地 flights.ctrip.com 宽屏航线比价页。
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

  let url: URL
  if (config.device === 'mobile') {
    url = new URL('https://m.ctrip.com/webapp/flight/index.html')
    url.searchParams.set('dcity', departure)
    url.searchParams.set('acity', arrival)
    if (date) {
      url.searchParams.set('ddate', date)
    }
  }
  else {
    url = new URL('https://flights.ctrip.com/online/channel/domestic')
    url.searchParams.set('dcity', departure)
    url.searchParams.set('acity', arrival)
    if (date) {
      url.searchParams.set('date', date)
    }
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 5. 携程用车 / 租车自驾直达链接自适应生成器
 */
export function buildCtripCarLink({
  city,
  ...options
}: CtripCarOptions): string {
  const config = getCtripAllianceConfig({
    sid: 'car_rental',
    ...options,
  })

  let url: URL
  if (config.device === 'mobile') {
    url = new URL('https://m.ctrip.com/webapp/car/index')
    if (city) {
      url.searchParams.set('city', city)
    }
  }
  else {
    url = new URL('https://car.ctrip.com/')
    if (city) {
      url.searchParams.set('city', city)
    }
  }

  url.searchParams.set('allianceid', config.allianceid)
  url.searchParams.set('sid', config.sid)
  if (config.ouid) {
    url.searchParams.set('ouid', config.ouid)
  }

  return url.toString()
}

/**
 * 客户端运行时智能分发点击助手：根据用户即时的屏幕物理宽度与环境直接在新窗口中打开
 */
export function openCtripAdaptiveLink(
  builderFn: (opts: any) => string,
  options: any,
): void {
  if (typeof window === 'undefined')
    return
  const targetUrl = builderFn({
    ...options,
    device: 'auto',
  })
  window.open(targetUrl, '_blank', 'noopener,noreferrer')
}

function copyTrackingParams(from: URL, to: URL) {
  const allianceid = from.searchParams.get('allianceid') || DEFAULT_CTRIP_ALLIANCE_ID
  const sid = from.searchParams.get('sid') || DEFAULT_CTRIP_SID
  const ouid = from.searchParams.get('ouid')
  to.searchParams.set('allianceid', allianceid)
  to.searchParams.set('sid', sid)
  if (ouid) {
    to.searchParams.set('ouid', ouid)
  }
}

/**
 * 根据设备类型自适应转换已有携程链接（PC 宽屏 vs 移动端 H5）
 */
export function adaptCtripUrlForDevice(
  rawUrl: string,
  device?: CtripDeviceTarget,
  userAgent?: string,
): string {
  try {
    const targetDevice = resolveEffectiveDevice(device, userAgent)
    const url = new URL(rawUrl)

    // 1. 目标是 PC 端，但链接是移动端 m.ctrip.com
    if (targetDevice === 'pc' && url.hostname === 'm.ctrip.com') {
      // 门票：m.ctrip.com/webapp/ticket/... -> you.ctrip.com/searchsite/district.html
      if (url.pathname.includes('/webapp/ticket')) {
        const keyword = url.searchParams.get('keyword') || ''
        const pcUrl = new URL('https://you.ctrip.com/searchsite/district.html')
        pcUrl.searchParams.set('query', keyword)
        copyTrackingParams(url, pcUrl)
        return pcUrl.toString()
      }
      // 酒店：m.ctrip.com/webapp/hotel/... -> hotels.ctrip.com/hotels/list
      if (url.pathname.includes('/webapp/hotel')) {
        const keyword = url.searchParams.get('keywords') || url.searchParams.get('cityName') || ''
        const pcUrl = new URL('https://hotels.ctrip.com/hotels/list')
        pcUrl.searchParams.set('keyword', keyword)
        const checkin = url.searchParams.get('checkInDate')
        const checkout = url.searchParams.get('checkOutDate')
        if (checkin)
          pcUrl.searchParams.set('checkin', checkin)
        if (checkout)
          pcUrl.searchParams.set('checkout', checkout)
        copyTrackingParams(url, pcUrl)
        return pcUrl.toString()
      }
      // 火车票：m.ctrip.com/webapp/train/... -> trains.ctrip.com/pages/booking/search
      if (url.pathname.includes('/webapp/train')) {
        const pcUrl = new URL('https://trains.ctrip.com/pages/booking/search')
        const dStation = url.searchParams.get('dStation')
        const aStation = url.searchParams.get('aStation')
        const date = url.searchParams.get('date')
        if (dStation)
          pcUrl.searchParams.set('dStation', dStation)
        if (aStation)
          pcUrl.searchParams.set('aStation', aStation)
        if (date)
          pcUrl.searchParams.set('date', date)
        copyTrackingParams(url, pcUrl)
        return pcUrl.toString()
      }
    }

    // 2. 目标是移动端，但链接是 PC 宽屏站
    if (targetDevice === 'mobile' && url.hostname !== 'm.ctrip.com') {
      if (url.hostname.includes('you.ctrip.com')) {
        const query = url.searchParams.get('query') || ''
        const mUrl = new URL('https://m.ctrip.com/webapp/ticket/ticketdetail/search.html')
        mUrl.searchParams.set('keyword', query)
        copyTrackingParams(url, mUrl)
        return mUrl.toString()
      }
      if (url.hostname.includes('hotels.ctrip.com')) {
        const query = url.searchParams.get('keyword') || url.searchParams.get('city') || ''
        const mUrl = new URL('https://m.ctrip.com/webapp/hotel/hotellist')
        mUrl.searchParams.set('keywords', query)
        const checkin = url.searchParams.get('checkin')
        const checkout = url.searchParams.get('checkout')
        if (checkin)
          mUrl.searchParams.set('checkInDate', checkin)
        if (checkout)
          mUrl.searchParams.set('checkOutDate', checkout)
        copyTrackingParams(url, mUrl)
        return mUrl.toString()
      }
    }

    return rawUrl
  }
  catch {
    return rawUrl
  }
}
