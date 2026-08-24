import { describe, expect, it } from 'vitest'
import {
  calculateBearing,
  calculateDistanceKm,
  estimateDurationMinutes,
  formatMinutesText,
  generateAmapRouteUrl,
  generateBaiduRouteUrl,
  generateTencentRouteUrl,
  getSpotCoordinates,
} from './amap'

describe('amap 工具与地理计算测试', () => {
  it('calculateDistanceKm 应计算两点间合理距离', () => {
    // 兵马俑与大雁塔之间的距离约 30-40km
    const dist = calculateDistanceKm(34.3841, 109.2785, 34.2189, 108.9640)
    expect(dist).toBeGreaterThan(25)
    expect(dist).toBeLessThan(50)
  })

  it('calculateBearing 应正确计算行进朝向角度', () => {
    // 正北方向 (0 / 360)
    const northBearing = calculateBearing(30.0, 100.0, 31.0, 100.0)
    expect(Math.round(northBearing)).toBe(0)

    // 正东方向 (90)
    const eastBearing = calculateBearing(30.0, 100.0, 30.0, 101.0)
    expect(Math.round(eastBearing)).toBe(90)
  })

  it('estimateDurationMinutes 针对不同交通模式给出符合常理的估算', () => {
    const drivingTime = estimateDurationMinutes(10, 'driving')
    const transitTime = estimateDurationMinutes(10, 'transit')
    const walkingTime = estimateDurationMinutes(10, 'walking')

    expect(drivingTime).toBeLessThan(transitTime)
    expect(transitTime).toBeLessThan(walkingTime)
  })

  it('formatMinutesText 格式化小时与分钟文案', () => {
    expect(formatMinutesText(45)).toBe('45分钟')
    expect(formatMinutesText(60)).toBe('1小时')
    expect(formatMinutesText(95)).toBe('1小时35分')
  })

  it('getSpotCoordinates 准确匹配已知景点与未知景点回退', () => {
    const bmy = getSpotCoordinates('兵马俑', '西安')
    expect(bmy.lat).toBeCloseTo(34.3841, 2)
    expect(bmy.lng).toBeCloseTo(109.2785, 2)

    // 模糊匹配
    const ggbwy = getSpotCoordinates('北京故宫博物院', '北京')
    expect(ggbwy.lat).toBeCloseTo(39.9163, 2)

    // 未知景点回退
    const unknown = getSpotCoordinates('某个不知名客栈', '成都', 2)
    expect(unknown.lat).toBeGreaterThan(30)
    expect(unknown.lng).toBeGreaterThan(103)
  })

  it('生成各平台地图导航链接', () => {
    const amap = generateAmapRouteUrl('大雁塔', '大唐不夜城', '西安', 'car')
    expect(amap).toContain('uri.amap.com/navigation')
    expect(amap).toContain('from=')

    const baidu = generateBaiduRouteUrl('大雁塔', '大唐不夜城', '西安', 'driving')
    expect(baidu).toContain('api.map.baidu.com/direction')

    const qq = generateTencentRouteUrl('大雁塔', '大唐不夜城', '西安', 'drive')
    expect(qq).toContain('apis.map.qq.com/uri/v1/routeplan')
  })
})
