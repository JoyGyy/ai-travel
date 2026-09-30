/**
 * 高德地图真实路线规划与地理编码客户端 API
 */

import { get, post } from './client';
import type {
  GeocodeResult,
  MultiPointRouteResult,
} from '@/lib/services/amapService';

export interface RouteApiRequest {
  city?: string;
  mode?: 'driving' | 'transit' | 'walking';
  points: { lat: number; lng: number }[];
}

export interface RouteApiResponse {
  data: MultiPointRouteResult;
  success: boolean;
}

export interface GeocodeApiResponse {
  data: GeocodeResult;
  success: boolean;
}

/**
 * 请求高德官方路径规划获取真实沿路轨迹及耗时
 */
export async function fetchRoutePolylineApi(
  points: { lat: number; lng: number }[],
  mode: 'driving' | 'transit' | 'walking' = 'driving',
  city = '杭州',
  options: { signal?: AbortSignal } = {},
): Promise<MultiPointRouteResult | null> {
  try {
    const res = await post<RouteApiResponse>(
      '/api/travel/map/route',
      { city, mode, points },
      { signal: options.signal },
    );
    if (res && res.success && res.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 请求高德官方地理编码查询景点精准经纬度与地址
 */
export async function fetchSpotGeocodeApi(
  keyword: string,
  city = '杭州',
  options: { signal?: AbortSignal } = {},
): Promise<GeocodeResult | null> {
  try {
    const res = await get<GeocodeApiResponse>(
      `/api/travel/map/geocode?keyword=${encodeURIComponent(
        keyword,
      )}&city=${encodeURIComponent(city)}`,
      { signal: options.signal },
    );
    if (res && res.success && res.data) {
      return res.data;
    }
    return null;
  } catch {
    return null;
  }
}
