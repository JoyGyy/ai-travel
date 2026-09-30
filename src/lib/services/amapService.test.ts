import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearAmapCache,
  parseAmapPolyline,
  planMultiPointRoute,
  planRouteSegment,
  searchSpotLocation,
} from './amapService';

describe('amapService 高德官方路径规划与地理编码服务', () => {
  const originalEnv = process.env.AMAP_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    clearAmapCache();
  });

  afterEach(() => {
    process.env.AMAP_API_KEY = originalEnv;
  });

  describe('parseAmapPolyline 折线坐标解析', () => {
    it('正确解析高德经纬度字符串为 Leaflet [lat, lng] 坐标数组', () => {
      const raw = '120.148868,30.259199;120.148828,30.259196;120.148726,30.259169';
      const parsed = parseAmapPolyline(raw);
      expect(parsed).toHaveLength(3);
      expect(parsed[0]).toEqual([30.259199, 120.148868]);
      expect(parsed[1]).toEqual([30.259196, 120.148828]);
      expect(parsed[2]).toEqual([30.259169, 120.148726]);
    });

    it('面对空串或格式异常时优雅返回空数组或过滤无效点', () => {
      expect(parseAmapPolyline('')).toEqual([]);
      expect(parseAmapPolyline('invalid,string;120.1,30.2;foo')).toEqual([
        [30.2, 120.1],
      ]);
    });
  });

  describe('searchSpotLocation 景点搜索与地理编码', () => {
    it('空关键字时优雅降级并返回城市中心默认坐标', async () => {
      const result = await searchSpotLocation('', '杭州');
      expect(result.source).toBe('local_fallback');
      expect(result.lat).toBeGreaterThan(30);
      expect(result.lng).toBeGreaterThan(120);
    });

    it('在未配置 KEY 或网络异常时平滑降级为本地预置字典', async () => {
      delete process.env.AMAP_API_KEY;
      const result = await searchSpotLocation('断桥残雪', '杭州');
      expect(result.source).toBe('local_fallback');
      expect(result.lat).toBeCloseTo(30.2589, 2);
      expect(result.lng).toBeCloseTo(120.1489, 2);
    });

    it('当高德 POI 接口正常返回时优先采用官方 POI 坐标与地址', async () => {
      process.env.AMAP_API_KEY = 'mock-key';
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: async () => ({
          count: '1',
          info: 'OK',
          infocode: '10000',
          pois: [
            {
              address: '西湖区孤山后山路1号',
              location: '120.142000,30.254000',
              name: '浙江省博物馆(孤山馆区)',
            },
          ],
          status: '1',
        }),
        ok: true,
      } as Response);

      const result = await searchSpotLocation(
        '浙江省博物馆',
        '杭州',
      );
      expect(result.source).toBe('amap');
      expect(result.lat).toBe(30.254);
      expect(result.lng).toBe(120.142);
      expect(result.formattedAddress).toBe('西湖区孤山后山路1号');
    });
  });

  describe('planRouteSegment 单段路线规划', () => {
    it('两点重合时直接返回 0 里程与 0 耗时，且不产生 NaN', async () => {
      const p = { lat: 30.25, lng: 120.15 };
      const res = await planRouteSegment(p, p, 'driving', '杭州');
      expect(res.distanceKm).toBe(0);
      expect(res.durationMins).toBe(0);
      expect(res.polyline).toHaveLength(2);
      expect(res.polyline[0]).toEqual([30.25, 120.15]);
    });

    it('未配置 KEY 或接口出错时平滑降级为平滑贝塞尔曲线', async () => {
      delete process.env.AMAP_API_KEY;
      const p1 = { lat: 30.2589, lng: 120.1489 };
      const p2 = { lat: 30.2415, lng: 120.1009 };
      const res = await planRouteSegment(p1, p2, 'driving', '杭州');
      expect(res.source).toBe('local_fallback');
      expect(res.distanceKm).toBeGreaterThan(0);
      expect(res.durationMins).toBeGreaterThan(0);
      expect(res.polyline.length).toBeGreaterThan(2);
      res.polyline.forEach(([lat, lng]) => {
        expect(Number.isFinite(lat)).toBe(true);
        expect(Number.isFinite(lng)).toBe(true);
      });
    });

    it('当高德驾车接口成功响应时解析出真实的沿路轨迹点与耗时', async () => {
      process.env.AMAP_API_KEY = 'mock-key';
      global.fetch = vi.fn().mockResolvedValueOnce({
        json: async () => ({
          info: 'OK',
          route: {
            paths: [
              {
                distance: '6200',
                duration: '1200',
                steps: [
                  {
                    distance: '3000',
                    duration: '600',
                    polyline: '120.148900,30.258900;120.130000,30.252000',
                  },
                  {
                    distance: '3200',
                    duration: '600',
                    polyline: '120.130000,30.252000;120.100900,30.241500',
                  },
                ],
              },
            ],
          },
          status: '1',
        }),
        ok: true,
      } as Response);

      const p1 = { lat: 30.2589, lng: 120.1489 };
      const p2 = { lat: 30.2415, lng: 120.1009 };
      const res = await planRouteSegment(p1, p2, 'driving', '杭州');

      expect(res.source).toBe('amap');
      expect(res.distanceKm).toBe(6.2);
      expect(res.durationMins).toBe(20);
      expect(res.polyline).toHaveLength(4);
    });
  });

  describe('planMultiPointRoute 多点路线连续拼接', () => {
    it('少于2个点时直接返回单点或空轨迹', async () => {
      const res = await planMultiPointRoute([{ lat: 30.25, lng: 120.15 }]);
      expect(res.legs).toHaveLength(0);
      expect(res.polyline).toEqual([[30.25, 120.15]]);
      expect(res.totalDistanceKm).toBe(0);
    });

    it('多点全行程正确拼接，去除相邻重复坐标并累加全程总耗时与里程', async () => {
      delete process.env.AMAP_API_KEY;
      const points = [
        { lat: 30.2589, lng: 120.1489 },
        { lat: 30.2415, lng: 120.1009 },
        { lat: 30.2312, lng: 120.148 },
      ];
      const res = await planMultiPointRoute(points, 'driving', '杭州');

      expect(res.legs).toHaveLength(2);
      expect(res.totalDistanceKm).toBeGreaterThan(0);
      expect(res.totalDurationMins).toBeGreaterThan(0);
      expect(res.polyline.length).toBeGreaterThan(points.length);
      res.polyline.forEach(([lat, lng]) => {
        expect(Number.isFinite(lat)).toBe(true);
        expect(Number.isFinite(lng)).toBe(true);
      });
    });
  });
});
