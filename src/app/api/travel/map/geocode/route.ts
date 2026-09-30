/**
 * 景点地理编码与 POI 查询 API
 * GET /api/travel/map/geocode?keyword=...&city=...
 *
 * 接入高德地图开放平台官方 POI / 地理编码检索
 * 返回精确的经纬度坐标与格式化地址，未命中时平滑降级
 */

import { NextResponse } from 'next/server';
import { searchSpotLocation } from '@/lib/services/amapService';
import { withRateLimit } from '@/lib/utils/http';

export const GET = withRateLimit('map:geocode', 120, 60_000, async (request) => {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword')?.trim() || '';
  const city = searchParams.get('city')?.trim() || '杭州';

  if (!keyword) {
    return NextResponse.json(
      { message: '请提供待检索的景点名称或关键字', success: false },
      { status: 400 },
    );
  }

  const result = await searchSpotLocation(keyword, city);

  return NextResponse.json({
    data: result,
    success: true,
  });
});
