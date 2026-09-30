/**
 * 真实路线规划 API
 * POST /api/travel/map/route
 *
 * 接入高德地图开放平台官方路径规划服务（驾车、公交、步行）
 * 返回真实的道路沿路行进轨迹 Polyline 与精准通勤时间/里程
 */

import { NextResponse } from 'next/server';
import { type GeoPoint, planMultiPointRoute } from '@/lib/services/amapService';
import { withRateLimit } from '@/lib/utils/http';

export const POST = withRateLimit('map:route', 60, 60_000, async (request) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { message: '请求体格式无效', success: false },
        { status: 400 },
      );
    }

    const { points, mode = 'driving', city = '杭州' } = body;

    if (!Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { message: '请提供有效的打卡点经纬度数组', success: false },
        { status: 400 },
      );
    }

    const validPoints: GeoPoint[] = [];
    for (const pt of points) {
      if (
        pt &&
        typeof pt === 'object' &&
        Number.isFinite(pt.lat) &&
        Number.isFinite(pt.lng)
      ) {
        validPoints.push({ lat: Number(pt.lat), lng: Number(pt.lng) });
      }
    }

    const validMode =
      mode === 'transit' || mode === 'walking' ? mode : 'driving';
    const validCity = typeof city === 'string' && city.trim() ? city.trim() : '杭州';

    const result = await planMultiPointRoute(validPoints, validMode, validCity);

    return NextResponse.json({
      data: result,
      success: true,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : '路径规划失败';
    return NextResponse.json(
      { message: errMessage, success: false },
      { status: 500 },
    );
  }
});
