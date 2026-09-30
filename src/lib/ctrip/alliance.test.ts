import { beforeEach, describe, expect, it } from 'vitest'

import {
  adaptCtripUrlForDevice,
  attachCtripAllianceParams,
  buildCtripCarLink,
  buildCtripFlightLink,
  buildCtripHotelLink,
  buildCtripTicketLink,
  buildCtripTrainLink,
  DEFAULT_CTRIP_ALLIANCE_ID,
  DEFAULT_CTRIP_SID,
  getCtripAllianceConfig,
  isMobileDevice,
  resolveEffectiveDevice,
} from './alliance'

describe('Ctrip Alliance (携程开放联盟) 设备自适应分发引擎', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_CTRIP_ALLIANCE_ID
    delete process.env.NEXT_PUBLIC_CTRIP_SID
  })

  it('设备识别函数 isMobileDevice 与 resolveEffectiveDevice 表现正确', () => {
    // 桌面端 UA
    const desktopUa = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36'
    expect(isMobileDevice(desktopUa)).toBe(false)
    expect(resolveEffectiveDevice('auto', desktopUa)).toBe('pc')

    // 移动端 iPhone UA
    const mobileUa = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'
    expect(isMobileDevice(mobileUa)).toBe(true)
    expect(resolveEffectiveDevice('auto', mobileUa)).toBe('mobile')

    // 显式指定强制目标
    expect(resolveEffectiveDevice('mobile', desktopUa)).toBe('mobile')
    expect(resolveEffectiveDevice('pc', mobileUa)).toBe('pc')
  })

  it('门票链接：全端统一落地携程官方 Tangram 门票中台（自适应呈现，彻底杜绝 you.ctrip.com 404）', () => {
    // 移动端分发
    const mobileLink = buildCtripTicketLink({
      city: '成都',
      device: 'mobile',
      spotName: '大熊猫繁育研究基地',
    })
    const mobileUrl = new URL(mobileLink)
    expect(mobileUrl.origin).toBe('https://m.ctrip.com')
    expect(mobileUrl.pathname).toBe('/tangram/ticket')
    expect(mobileUrl.searchParams.get('keyword')).toBe('成都 大熊猫繁育研究基地')
    expect(mobileUrl.searchParams.get('allianceid')).toBe(DEFAULT_CTRIP_ALLIANCE_ID)
    expect(mobileUrl.searchParams.get('sid')).toBe('attraction_ticket')

    // PC 端分发（由于旧版 you.ctrip.com 404，PC 端统一由携程官方自适应 tangram/ticket 承接）
    const pcLink = buildCtripTicketLink({
      city: '成都',
      device: 'pc',
      spotName: '大熊猫繁育研究基地',
    })
    const pcUrl = new URL(pcLink)
    expect(pcUrl.origin).toBe('https://m.ctrip.com')
    expect(pcUrl.pathname).toBe('/tangram/ticket')
    expect(pcUrl.searchParams.get('keyword')).toBe('成都 大熊猫繁育研究基地')
    expect(pcUrl.searchParams.get('allianceid')).toBe(DEFAULT_CTRIP_ALLIANCE_ID)
  })

  it('酒店链接：手机端落地 m.ctrip.com，PC 端落地 hotels.ctrip.com 宽屏列表', () => {
    // 移动端
    const mobileLink = buildCtripHotelLink({
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      city: '杭州',
      device: 'mobile',
      keyword: '西湖景区周边',
    })
    const mobileUrl = new URL(mobileLink)
    expect(mobileUrl.origin).toBe('https://m.ctrip.com')
    expect(mobileUrl.pathname).toBe('/webapp/hotel/hotellist')
    expect(mobileUrl.searchParams.get('cityName')).toBe('杭州')

    // PC 端
    const pcLink = buildCtripHotelLink({
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-03',
      city: '杭州',
      device: 'pc',
      keyword: '西湖景区周边',
    })
    const pcUrl = new URL(pcLink)
    expect(pcUrl.origin).toBe('https://hotels.ctrip.com')
    expect(pcUrl.pathname).toBe('/hotels/list')
    expect(pcUrl.searchParams.get('city')).toBe('杭州')
    expect(pcUrl.searchParams.get('keyword')).toBe('西湖景区周边')
    expect(pcUrl.searchParams.get('checkin')).toBe('2026-10-01')
    expect(pcUrl.searchParams.get('checkout')).toBe('2026-10-03')
  })

  it('车票链接：手机端落地 m.ctrip.com，PC 端落地 trains.ctrip.com 宽屏时刻表', () => {
    // 移动端
    const mobileLink = buildCtripTrainLink({
      arrival: '成都东',
      date: '2026-10-01',
      departure: '西安北',
      device: 'mobile',
    })
    const mobileUrl = new URL(mobileLink)
    expect(mobileUrl.origin).toBe('https://m.ctrip.com')
    expect(mobileUrl.pathname).toBe('/webapp/train/')

    // PC 端
    const pcLink = buildCtripTrainLink({
      arrival: '成都东',
      date: '2026-10-01',
      departure: '西安北',
      device: 'pc',
    })
    const pcUrl = new URL(pcLink)
    expect(pcUrl.origin).toBe('https://trains.ctrip.com')
    expect(pcUrl.pathname).toBe('/pages/booking/search')
    expect(pcUrl.searchParams.get('dStation')).toBe('西安北')
    expect(pcUrl.searchParams.get('aStation')).toBe('成都东')
    expect(pcUrl.searchParams.get('date')).toBe('2026-10-01')
  })

  it('机票链接：手机端落地 m.ctrip.com，PC 端落地 flights.ctrip.com 宽屏航线', () => {
    // 移动端
    const mobileLink = buildCtripFlightLink({
      arrival: '三亚',
      date: '2026-10-01',
      departure: '北京',
      device: 'mobile',
    })
    expect(mobileLink).toContain('https://m.ctrip.com/webapp/flight/index.html')

    // PC 端
    const pcLink = buildCtripFlightLink({
      arrival: '三亚',
      date: '2026-10-01',
      departure: '北京',
      device: 'pc',
    })
    expect(pcLink).toContain('https://flights.ctrip.com/online/channel/domestic')
  })

  it('用车链接：手机端落地 m.ctrip.com，PC 端落地 car.ctrip.com', () => {
    const mobileLink = buildCtripCarLink({ city: '大理', device: 'mobile' })
    expect(mobileLink).toContain('https://m.ctrip.com/webapp/car/index')

    const pcLink = buildCtripCarLink({ city: '大理', device: 'pc' })
    expect(pcLink).toContain('https://car.ctrip.com/')
  })

  it('attachCtripAllianceParams 应保留原 URL 查询参数并追加追踪参数', () => {
    const base = 'https://hotels.ctrip.com/hotels/list?city=1'
    const enriched = attachCtripAllianceParams(base, {
      ouid: 'u_123',
      sid: 'pc_banner',
    })
    const url = new URL(enriched)
    expect(url.searchParams.get('city')).toBe('1')
    expect(url.searchParams.get('allianceid')).toBe(DEFAULT_CTRIP_ALLIANCE_ID)
    expect(url.searchParams.get('sid')).toBe('pc_banner')
    expect(url.searchParams.get('ouid')).toBe('u_123')
  })

  it('adaptCtripUrlForDevice 能够智能在 PC 宽屏官网与移动端 H5 间双向转换，并救助 404 门票链接', () => {
    // 1. 移动端旧版门票链接在全端打开时规范化为官方 tangram/ticket 活链
    const mobileTicket = 'https://m.ctrip.com/webapp/ticket/ticketdetail/search.html?keyword=%E6%88%90%E9%83%BD%20%E9%94%A6%E9%87%8C&allianceid=4897000&sid=spot'
    const pcAdaptedTicket = adaptCtripUrlForDevice(mobileTicket, 'pc')
    expect(pcAdaptedTicket).toContain('https://m.ctrip.com/tangram/ticket')
    expect(pcAdaptedTicket).toContain('keyword=%E6%88%90%E9%83%BD+%E9%94%A6%E9%87%8C')
    expect(pcAdaptedTicket).toContain('allianceid=4897000')
    expect(pcAdaptedTicket).toContain('sid=spot')

    // 2. 已下线 404 的 you.ctrip.com 门票链接被自动纠偏保活
    const old404Ticket = 'https://you.ctrip.com/searchsite/district.html?query=%E4%B8%BD%E6%B1%9F+%E7%8E%89%E9%BE%99%E9%9B%AA%E5%B1%B1&allianceid=4897000&sid=attraction_detail_ticket'
    const rescuedTicket = adaptCtripUrlForDevice(old404Ticket, 'pc')
    expect(rescuedTicket).toContain('https://m.ctrip.com/tangram/ticket')
    expect(rescuedTicket).toContain('keyword=%E4%B8%BD%E6%B1%9F+%E7%8E%89%E9%BE%99%E9%9B%AA%E5%B1%B1')
    expect(rescuedTicket).toContain('allianceid=4897000')
    expect(rescuedTicket).toContain('sid=attraction_detail_ticket')

    // 3. 酒店：移动端转 PC 宽屏官网
    const mobileHotel = 'https://m.ctrip.com/webapp/hotel/hotellist?cityName=%E6%88%90%E9%83%BD&keywords=%E6%98%A5%E7%86%99%E8%B7%AF&checkInDate=2026-10-01&checkOutDate=2026-10-03&allianceid=4897000&sid=hotel'
    const pcAdaptedHotel = adaptCtripUrlForDevice(mobileHotel, 'pc')
    expect(pcAdaptedHotel).toContain('https://hotels.ctrip.com/hotels/list')
    expect(pcAdaptedHotel).toContain('checkin=2026-10-01')
    expect(pcAdaptedHotel).toContain('checkout=2026-10-03')

    // 4. PC 端链接在移动端打开时转为移动端触屏 H5
    const pcHotel = 'https://hotels.ctrip.com/hotels/list?keyword=%E6%88%90%E9%83%BD&checkin=2026-10-01&checkout=2026-10-03&allianceid=4897000&sid=hotel'
    const mobileAdaptedHotel = adaptCtripUrlForDevice(pcHotel, 'mobile')
    expect(mobileAdaptedHotel).toContain('https://m.ctrip.com/webapp/hotel/hotellist')
    expect(mobileAdaptedHotel).toContain('checkInDate=2026-10-01')
    expect(mobileAdaptedHotel).toContain('checkOutDate=2026-10-03')
  })
})
