import { describe, expect, it } from 'vitest';
import {
  calculateBearing,
  calculateDistanceKm,
  calculateNormalOffset,
  estimateDurationMinutes,
  formatMinutesText,
  gcj02ToBd09,
  generateAmapNativeSchemeUrl,
  generateAmapRouteUrl,
  generateAmapSpotUrl,
  generateBaiduRouteUrl,
  generateBaiduSpotUrl,
  generateSmoothRoutePolyline,
  generateTencentRouteUrl,
  generateTencentSpotUrl,
  getSpotCoordinates,
} from './amap';

describe('amap 工具与地理计算测试', () => {
  it('calculateDistanceKm 应计算两点间合理距离', () => {
    // 兵马俑与大雁塔之间的距离约 30-40km
    const dist = calculateDistanceKm(34.3841, 109.2785, 34.2189, 108.964);
    expect(dist).toBeGreaterThan(25);
    expect(dist).toBeLessThan(50);
  });

  it('calculateBearing 应正确计算行进朝向角度', () => {
    // 正北方向 (0 / 360)
    const northBearing = calculateBearing(30.0, 100.0, 31.0, 100.0);
    expect(Math.round(northBearing)).toBe(0);

    // 正东方向 (90)
    const eastBearing = calculateBearing(30.0, 100.0, 30.0, 101.0);
    expect(Math.round(eastBearing)).toBe(90);
  });

  it('gcj02ToBd09 坐标转换正确', () => {
    const bd = gcj02ToBd09(34.2189, 108.964);
    expect(bd.lat).toBeGreaterThan(34);
    expect(bd.lng).toBeGreaterThan(108);
  });

  it('estimateDurationMinutes 针对不同交通模式给出符合常理的估算', () => {
    const drivingTime = estimateDurationMinutes(10, 'driving');
    const transitTime = estimateDurationMinutes(10, 'transit');
    const walkingTime = estimateDurationMinutes(10, 'walking');

    expect(drivingTime).toBeLessThan(transitTime);
    expect(transitTime).toBeLessThan(walkingTime);
  });

  it('formatMinutesText 格式化小时与分钟文案', () => {
    expect(formatMinutesText(45)).toBe('45分钟');
    expect(formatMinutesText(60)).toBe('1小时');
    expect(formatMinutesText(95)).toBe('1小时35分');
  });

  it('getSpotCoordinates 准确匹配已知景点与未知景点回退', () => {
    const bmy = getSpotCoordinates('兵马俑', '西安');
    expect(bmy.lat).toBeCloseTo(34.3841, 2);
    expect(bmy.lng).toBeCloseTo(109.2785, 2);

    // 模糊匹配
    const ggbwy = getSpotCoordinates('北京故宫博物院', '北京');
    expect(ggbwy.lat).toBeCloseTo(39.9163, 2);

    // 杭州著名景点
    const bd = getSpotCoordinates('白堤', '杭州');
    expect(bd.lat).toBeCloseTo(30.2575, 2);
    expect(bd.lng).toBeCloseTo(120.1472, 2);

    // 未知景点回退
    const unknown = getSpotCoordinates('某个不知名客栈', '成都', 2);
    expect(unknown.lat).toBeGreaterThan(30);
    expect(unknown.lng).toBeGreaterThan(103);
  });

  it('生成各平台地图导航路线链接，必须包含真实经纬度与名称', () => {
    const from = { lat: 34.2255, lng: 108.954, name: '陕西历史博物馆' };
    const to = { lat: 34.2189, lng: 108.964, name: '大雁塔' };
    const waypoints = [{ lat: 34.212, lng: 108.973, name: '大唐芙蓉园' }];

    // 高德: from=lng,lat,name&to=lng,lat,name&via=lng,lat,name
    const amap = generateAmapRouteUrl(from, to, '西安', 'car', waypoints);
    expect(amap).toContain('uri.amap.com/navigation');
    expect(amap).toContain('from=108.954,34.2255');
    expect(amap).toContain('to=108.964,34.2189');
    expect(amap).toContain('via=108.973,34.212');

    // 百度: origin=latlng:lat,lng|name:xxx&destination=latlng:lat,lng|name:xxx&waypoints=...
    const baidu = generateBaiduRouteUrl(from, to, '西安', 'driving', waypoints);
    expect(baidu).toContain('api.map.baidu.com/direction');
    expect(baidu).toContain('origin=latlng:');
    expect(baidu).toContain('destination=latlng:');
    expect(baidu).toContain('waypoints=latlng:');

    // 腾讯: from=xxx&fromcoord=lat,lng&to=xxx&tocoord=lat,lng&via=...
    const qq = generateTencentRouteUrl(from, to, '西安', 'drive', waypoints);
    expect(qq).toContain('apis.map.qq.com/uri/v1/routeplan');
    expect(qq).toContain('fromcoord=34.2255,108.954');
    expect(qq).toContain('tocoord=34.2189,108.964');
    expect(qq).toContain('via=34.212,108.973');
  });

  it('生成各平台单点标记查看链接', () => {
    const spot = { lat: 34.3841, lng: 109.2785, name: '兵马俑' };

    const amap = generateAmapSpotUrl(spot, '西安');
    expect(amap).toContain('uri.amap.com/marker?position=109.2785,34.3841');

    const baidu = generateBaiduSpotUrl(spot, '西安');
    expect(baidu).toContain('api.map.baidu.com/marker?location=');

    const qq = generateTencentSpotUrl(spot, '西安');
    expect(qq).toContain(
      'apis.map.qq.com/uri/v1/marker?marker=coord:34.3841,109.2785',
    );
  });

  it('生成高德地图移动端原生 App 导航 URI Scheme 协议链接', () => {
    const from = { lat: 30.2589, lng: 120.1489, name: '断桥残雪' };
    const to = { lat: 30.2415, lng: 120.1009, name: '灵隐寺' };

    const scheme = generateAmapNativeSchemeUrl(from, to, '杭州', 'bus');
    expect(scheme).toContain('amapuri://route/plan/');
    expect(scheme).toContain('sourceApplication=TravelAI');
    expect(scheme).toContain(`sname=${encodeURIComponent('断桥残雪')}`);
    expect(scheme).toContain(`dname=${encodeURIComponent('灵隐寺')}`);
    expect(scheme).toContain('t=1'); // 公交模式
  });

  it('calculateNormalOffset 应计算中点垂直法线偏移位置，防止气泡遮挡折线与标记', () => {
    // 东西向两点
    const p1 = { lat: 30.25, lng: 120.1 };
    const p2 = { lat: 30.25, lng: 120.2 };
    const offset = calculateNormalOffset(p1.lat, p1.lng, p2.lat, p2.lng, 0.1);

    expect(offset.lng).toBeCloseTo(120.15, 2);
    // 经法线偏移后纬度应不等于原中点纬度
    expect(offset.lat).not.toBe(30.25);
  });

  it('generateSmoothRoutePolyline 应为折线点生成平滑插值点集', () => {
    const points = [
      { lat: 30.2589, lng: 120.1489 },
      { lat: 30.2415, lng: 120.1009 },
      { lat: 30.2662, lng: 120.061 },
    ];
    const smooth = generateSmoothRoutePolyline(points, 0.1);
    // 3 个点插值后点数应显著大于 3
    expect(smooth.length).toBeGreaterThan(15);
    // 首尾点应保持一致
    expect(smooth[0][0]).toBeCloseTo(points[0].lat, 4);
    expect(smooth[0][1]).toBeCloseTo(points[0].lng, 4);
    expect(smooth[smooth.length - 1][0]).toBeCloseTo(points[2].lat, 4);
    expect(smooth[smooth.length - 1][1]).toBeCloseTo(points[2].lng, 4);
  });
});
