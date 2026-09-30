/**
 * 高德地图开放平台官方 Web API 服务
 * 支持全国精准景点地理编码 / POI 检索，以及真实道路沿路行进轨迹规划（驾车/公交/步行）
 * 内置高可用内存缓存（TTL）、防除零和异常自动平滑降级能力
 */

import {
  calculateDistanceKm,
  estimateDurationMinutes,
  generateCurvedSegmentPoints,
  getSpotCoordinates,
} from '@/lib/map/amap';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  formattedAddress: string;
  lat: number;
  lng: number;
  name: string;
  source: 'amap' | 'local_fallback';
}

export interface RouteLegResult {
  distanceKm: number;
  durationMins: number;
  polyline: [number, number][];
  source: 'amap' | 'local_fallback';
}

export interface MultiPointRouteResult {
  legs: RouteLegResult[];
  polyline: [number, number][];
  source: 'amap' | 'local_fallback';
  totalDistanceKm: number;
  totalDurationMins: number;
}

// 内存缓存字典与过期控制 (1 小时 TTL，最大 1000 条条目)
interface CacheEntry<T> {
  data: T;
  expireAt: number;
}
const cacheStore = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_SIZE = 1000;

function getCached<T>(key: string): null | T {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expireAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T): void {
  if (cacheStore.size >= MAX_CACHE_SIZE) {
    const firstKey = cacheStore.keys().next().value;
    if (firstKey) cacheStore.delete(firstKey);
  }
  cacheStore.set(key, {
    data,
    expireAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * 将高德 API 返回的折线字符串解析为 Leaflet 所需的 [lat, lng] 坐标数组
 * 高德格式: "lng1,lat1;lng2,lat2;..."
 */
export function parseAmapPolyline(polylineStr: string): [number, number][] {
  if (!polylineStr || typeof polylineStr !== 'string') return [];
  const coords: [number, number][] = [];
  const pairs = polylineStr.split(';');

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(',');
    if (parts.length >= 2) {
      const lng = Number(parts[0]);
      const lat = Number(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        coords.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
      }
    }
  }

  return coords;
}

/**
 * 检索景点精准地理编码与经纬度 (高德 POI 检索 + 地理编码通道)
 * 若无有效 Key 或网络异常，无缝降级为本地预置坐标字典与排布
 */
export async function searchSpotLocation(
  keyword: string,
  city = '杭州',
): Promise<GeocodeResult> {
  const cleanKeyword = keyword?.trim() || '';
  const cleanCity = city?.trim() || '杭州';

  if (!cleanKeyword) {
    const fallbackCoord = getSpotCoordinates('', cleanCity);
    return {
      formattedAddress: `${cleanCity}市区`,
      lat: fallbackCoord.lat,
      lng: fallbackCoord.lng,
      name: cleanKeyword,
      source: 'local_fallback',
    };
  }

  const cacheKey = `geocode_${cleanCity}_${cleanKeyword}`;
  const cached = getCached<GeocodeResult>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.AMAP_API_KEY;

  if (apiKey) {
    try {
      // 1. 优先尝试高德 POI 关键字搜索 (针对景点/地标最精准)
      const placeUrl = `https://restapi.amap.com/v3/place/text?keywords=${encodeURIComponent(
        cleanKeyword,
      )}&city=${encodeURIComponent(cleanCity)}&key=${apiKey}&extensions=base&offset=1&page=1`;

      const placeRes = await fetch(placeUrl, { signal: AbortSignal.timeout(4000) });
      if (placeRes.ok) {
        const placeData = await placeRes.json();
        if (
          placeData.status === '1' &&
          Array.isArray(placeData.pois) &&
          placeData.pois.length > 0 &&
          placeData.pois[0].location
        ) {
          const poi = placeData.pois[0];
          const [lngStr, latStr] = (poi.location as string).split(',');
          const lng = Number(lngStr);
          const lat = Number(latStr);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const result: GeocodeResult = {
              formattedAddress: (poi.address && typeof poi.address === 'string' && poi.address.length > 0)
                ? poi.address
                : `${cleanCity} · ${poi.name || cleanKeyword}`,
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              name: poi.name || cleanKeyword,
              source: 'amap',
            };
            setCache(cacheKey, result);
            return result;
          }
        }
      }

      // 2. 次选尝试高德地理编码 (Geocode) 地址转换
      const geoUrl = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(
        cleanKeyword,
      )}&city=${encodeURIComponent(cleanCity)}&key=${apiKey}`;

      const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(4000) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (
          geoData.status === '1' &&
          Array.isArray(geoData.geocodes) &&
          geoData.geocodes.length > 0 &&
          geoData.geocodes[0].location
        ) {
          const geo = geoData.geocodes[0];
          const [lngStr, latStr] = (geo.location as string).split(',');
          const lng = Number(lngStr);
          const lat = Number(latStr);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            const result: GeocodeResult = {
              formattedAddress: geo.formatted_address || `${cleanCity}市区`,
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              name: cleanKeyword,
              source: 'amap',
            };
            setCache(cacheKey, result);
            return result;
          }
        }
      }
    } catch {
      // 网络超时或外部异常，静默落入平滑降级
    }
  }

  // 3. 降级方案：使用本地经典景点字典或围绕城市中心有序排布
  const fallbackCoord = getSpotCoordinates(cleanKeyword, cleanCity);
  const fallbackResult: GeocodeResult = {
    formattedAddress: `${cleanCity}市区`,
    lat: fallbackCoord.lat,
    lng: fallbackCoord.lng,
    name: cleanKeyword,
    source: 'local_fallback',
  };
  setCache(cacheKey, fallbackResult);
  return fallbackResult;
}

/**
 * 规划两个相邻打卡点之间的单段真实行进路线 (高德路径规划 Web 服务 API)
 * 支持驾车 (driving)、公交 (transit)、步行 (walking)
 * 异常或无 Key 时降级为本地二次贝塞尔曲线 + 估算耗时
 */
export async function planRouteSegment(
  origin: GeoPoint,
  destination: GeoPoint,
  mode: 'driving' | 'transit' | 'walking' = 'driving',
  city = '杭州',
): Promise<RouteLegResult> {
  // 1. 重合点防护
  if (
    !Number.isFinite(origin.lat) ||
    !Number.isFinite(origin.lng) ||
    !Number.isFinite(destination.lat) ||
    !Number.isFinite(destination.lng)
  ) {
    return {
      distanceKm: 0,
      durationMins: 0,
      polyline: [],
      source: 'local_fallback',
    };
  }

  if (
    Math.abs(origin.lat - destination.lat) < 1e-5 &&
    Math.abs(origin.lng - destination.lng) < 1e-5
  ) {
    return {
      distanceKm: 0,
      durationMins: 0,
      polyline: [
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ],
      source: 'amap',
    };
  }

  const cacheKey = `route_${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}_${destination.lat.toFixed(5)},${destination.lng.toFixed(5)}_${mode}_${city}`;
  const cached = getCached<RouteLegResult>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.AMAP_API_KEY;

  if (apiKey) {
    try {
      if (mode === 'driving') {
        const url = `https://restapi.amap.com/v3/direction/driving?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&key=${apiKey}&extensions=base&strategy=0`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === '1' && data.route?.paths?.[0]) {
            const path = data.route.paths[0];
            const distanceKm = Number((Number(path.distance) / 1000).toFixed(1));
            const durationMins = Math.max(Math.round(Number(path.duration) / 60), 1);
            const stepPolylines = (path.steps || [])
              .map((s: { polyline: string }) => s.polyline)
              .filter(Boolean)
              .join(';');
            const parsedPoints = parseAmapPolyline(stepPolylines);

            if (parsedPoints.length >= 2) {
              const leg: RouteLegResult = {
                distanceKm,
                durationMins,
                polyline: parsedPoints,
                source: 'amap',
              };
              setCache(cacheKey, leg);
              return leg;
            }
          }
        }
      } else if (mode === 'walking') {
        const url = `https://restapi.amap.com/v3/direction/walking?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === '1' && data.route?.paths?.[0]) {
            const path = data.route.paths[0];
            const distanceKm = Number((Number(path.distance) / 1000).toFixed(1));
            const durationMins = Math.max(Math.round(Number(path.duration) / 60), 1);
            const stepPolylines = (path.steps || [])
              .map((s: { polyline: string }) => s.polyline)
              .filter(Boolean)
              .join(';');
            const parsedPoints = parseAmapPolyline(stepPolylines);

            if (parsedPoints.length >= 2) {
              const leg: RouteLegResult = {
                distanceKm,
                durationMins,
                polyline: parsedPoints,
                source: 'amap',
              };
              setCache(cacheKey, leg);
              return leg;
            }
          }
        }
      } else if (mode === 'transit') {
        const url = `https://restapi.amap.com/v3/direction/transit/integrated?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&city=${encodeURIComponent(
          city,
        )}&key=${apiKey}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const data = await res.json();
          if (data.status === '1' && data.route?.transits?.[0]) {
            const transit = data.route.transits[0];
            const distanceKm = Number((Number(transit.distance) / 1000).toFixed(1));
            const durationMins = Math.max(Math.round(Number(transit.duration) / 60), 1);

            const allSegmentPolylines: string[] = [];
            (transit.segments || []).forEach(
              (seg: {
                bus?: { buslines?: { polyline: string }[] };
                walking?: { steps?: { polyline: string }[] };
              }) => {
                if (seg.walking?.steps) {
                  seg.walking.steps.forEach((st) => {
                    if (st.polyline) allSegmentPolylines.push(st.polyline);
                  });
                }
                if (seg.bus?.buslines) {
                  seg.bus.buslines.forEach((b) => {
                    if (b.polyline) allSegmentPolylines.push(b.polyline);
                  });
                }
              },
            );

            const parsedPoints = parseAmapPolyline(allSegmentPolylines.join(';'));
            if (parsedPoints.length >= 2) {
              const leg: RouteLegResult = {
                distanceKm,
                durationMins,
                polyline: parsedPoints,
                source: 'amap',
              };
              setCache(cacheKey, leg);
              return leg;
            }
          }
        }
      }
    } catch {
      // 外部接口异常或超时，静默转入降级
    }
  }

  // 降级：本地二次贝塞尔平滑弧线与估算
  const distKm = calculateDistanceKm(
    origin.lat,
    origin.lng,
    destination.lat,
    destination.lng,
  );
  const durationMins = estimateDurationMinutes(distKm, mode);
  const curved = generateCurvedSegmentPoints(origin, destination, 0.08, 16);

  const fallbackLeg: RouteLegResult = {
    distanceKm: distKm,
    durationMins,
    polyline: curved,
    source: 'local_fallback',
  };
  setCache(cacheKey, fallbackLeg);
  return fallbackLeg;
}

/**
 * 规划全行程多点连续导航路径 (连贯拼接每两个打卡点之间的沿路行进轨迹)
 */
export async function planMultiPointRoute(
  points: GeoPoint[],
  mode: 'driving' | 'transit' | 'walking' = 'driving',
  city = '杭州',
): Promise<MultiPointRouteResult> {
  const validPoints = (points || []).filter(
    (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );

  if (validPoints.length < 2) {
    return {
      legs: [],
      polyline: validPoints.map((p) => [p.lat, p.lng]),
      source: 'amap',
      totalDistanceKm: 0,
      totalDurationMins: 0,
    };
  }

  const legPromises: Promise<RouteLegResult>[] = [];
  for (let i = 0; i < validPoints.length - 1; i++) {
    legPromises.push(
      planRouteSegment(validPoints[i], validPoints[i + 1], mode, city),
    );
  }

  const legs = await Promise.all(legPromises);

  // 连贯拼接完整路线点集，去除相邻分段间的重复首尾坐标
  const fullPolyline: [number, number][] = [];
  legs.forEach((leg, idx) => {
    if (!leg.polyline || leg.polyline.length === 0) return;
    if (idx === 0) {
      fullPolyline.push(...leg.polyline);
    } else {
      fullPolyline.push(...leg.polyline.slice(1));
    }
  });

  const totalDistanceKm = Number(
    legs.reduce((acc, leg) => acc + leg.distanceKm, 0).toFixed(1),
  );
  const totalDurationMins = legs.reduce(
    (acc, leg) => acc + leg.durationMins,
    0,
  );
  const anyFallback = legs.some((l) => l.source === 'local_fallback');

  return {
    legs,
    polyline:
      fullPolyline.length >= 2
        ? fullPolyline
        : validPoints.map((p) => [p.lat, p.lng]),
    source: anyFallback ? 'local_fallback' : 'amap',
    totalDistanceKm,
    totalDurationMins,
  };
}
