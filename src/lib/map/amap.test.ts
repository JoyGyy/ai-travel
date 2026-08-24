import { describe, expect, it } from 'vitest'
import {
  calculateBearing,
  calculateDistanceKm,
  estimateDurationMinutes,
  formatMinutesText,
  gcj02ToBd09,
  generateAmapRouteUrl,
  generateAmapSpotUrl,
  generateBaiduRouteUrl,
  generateBaiduSpotUrl,
  generateTencentRouteUrl,
  generateTencentSpotUrl,
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

  it('gcj02ToBd09 坐标转换正确', () => {
    const bd = gcj02ToBd09(34.2189, 108.9640)
    expect(bd.lat).toBeGreaterThan(34)
    expect(bd.lng).toBeGreaterThan(108)
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

  it('生成各平台地图导航路线链接，必须包含真实经纬度与名称', () => {
    const from = { lat: 34.2255, lng: 108.9540, name: '陕西历史博物馆' }
    const to = { lat: 34.2189, lng: 108.9640, name: '大雁塔' }

    // 高德: from=lng,lat,name&to=lng,lat,name
    const amap = generateAmapRouteUrl(from, to, '西安', 'car')
    expect(amap).toContain('uri.amap.com/navigation')
    expect(amap).toContain('from=108.954,34.2255')
    expect(amap).toContain('to=108.964,34.2189')

    // 百度: origin=latlng:lat,lng|name:xxx&destination=latlng:lat,lng|name:xxx
    const baidu = generateBaiduRouteUrl(from, to, '西安', 'driving')
    expect(baidu).toContain('api.map.baidu.com/direction')
    expect(baidu).toContain('origin=latlng:')
    expect(baidu).toContain('destination=latlng:')

    // 腾讯: from=xxx&fromcoord=lat,lng&to=xxx&tocoord=lat,lng
    const qq = generateTencentRouteUrl(from, to, '西安', 'drive')
    expect(qq).toContain('apis.map.qq.com/uri/v1/routeplan')
    expect(qq).toContain('fromcoord=34.2255,108.954')
    expect(qq).toContain('tocoord=34.2189,108.964')
  })

  it('生成各平台单点标记查看链接', () => {
    const spot = { lat: 34.3841, lng: 109.2785, name: '兵马俑' }

    const amap = generateAmapSpotUrl(spot, '西安')
    expect(amap).toContain('uri.amap.com/marker?position=109.2785,34.3841')

    const baidu = generateBaiduSpotUrl(spot, '西安')
    expect(baidu).toContain('api.map.baidu.com/marker?location=')

    const qq = generateTencentSpotUrl(spot, '西安')
    expect(qq).toContain('apis.map.qq.com/uri/v1/marker?marker=coord:34.3841,109.2785')
  })
})
