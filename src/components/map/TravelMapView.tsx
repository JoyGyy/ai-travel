'use client';

import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from 'leaflet';
import type React from 'react';
import type { ParsedRouteSpot } from '@/lib/map/route-parser';
import type {
  ResourceCategory,
  WorkspaceSpotNode,
} from '@/stores/itineraryWorkspace';
import {
  Building2,
  Car,
  Clock,
  Compass,
  ExternalLink,
  Footprints,
  Hotel,
  LocateFixed,
  Maximize2,
  Minimize2,
  Navigation as NavigationIcon,
  ShoppingBag,
  Train,
  Utensils,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateBearing,
  calculateDistanceKm,
  calculateMidPoint,
  estimateDurationMinutes,
  formatMinutesText,
  generateAmapRouteUrl,
  generateAmapSpotUrl,
  generateBaiduRouteUrl,
  generateBaiduSpotUrl,
  generateTencentRouteUrl,
  generateTencentSpotUrl,
  getSpotCoordinates,
} from '@/lib/map/amap';
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace';
import { FloatingPoiCard } from './FloatingPoiCard';
import 'leaflet/dist/leaflet.css';

export interface TravelMapViewProps {
  city?: string;
  className?: string;
  initialMode?: 'driving' | 'transit' | 'walking';
  spots?: ParsedRouteSpot[];
}

type TileLayerType = 'amap-street' | 'amap-satellite' | 'cartodb';

const CATEGORY_TABS: {
  icon: React.ComponentType<{ className?: string }>;
  id: ResourceCategory;
  label: string;
}[] = [
  { icon: Compass, id: 'attractions', label: '景点' },
  { icon: Hotel, id: 'hotels', label: '酒店' },
  { icon: Utensils, id: 'restaurants', label: '美食' },
  { icon: ShoppingBag, id: 'shopping', label: '购物' },
  { icon: Train, id: 'transport', label: '交通' },
];

export function TravelMapView({
  city: propCity,
  className = '',
  initialMode = 'driving',
  spots: propSpots = [],
}: TravelMapViewProps): React.JSX.Element | null {
  // 1. 读取工作台状态
  const workspaceCity = useItineraryWorkspaceStore((s) => s.city);
  const workspaceDays = useItineraryWorkspaceStore((s) => s.days);
  const selectedDay = useItineraryWorkspaceStore((s) => s.selectedDay);
  const activeSpotId = useItineraryWorkspaceStore((s) => s.activeSpotId);
  const setActiveSpotId = useItineraryWorkspaceStore((s) => s.setActiveSpotId);
  const activeCategory = useItineraryWorkspaceStore((s) => s.activeCategory);
  const setActiveCategory = useItineraryWorkspaceStore(
    (s) => s.setActiveCategory,
  );
  const workspaceTransportMode = useItineraryWorkspaceStore(
    (s) => s.transportMode,
  );
  const setWorkspaceTransportMode = useItineraryWorkspaceStore(
    (s) => s.setTransportMode,
  );

  const city = propCity || workspaceCity || '杭州';
  const mode = workspaceTransportMode || initialMode;

  const [activeTab, setActiveTab] = useState<'map' | 'legs'>('map');
  const [tileType, setTileType] = useState<TileLayerType>('amap-street');
  const [activeSpotIndex, setActiveSpotIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const bgPolylineRef = useRef<LeafletPolyline | null>(null);
  const fullPolylineRef = useRef<LeafletPolyline | null>(null);
  const tileLayerRef = useRef<unknown>(null);
  const overlayLayerRef = useRef<unknown>(null);

  // 2. 根据工作台多天筛选或 props 汇总打卡点
  const currentSpots: ParsedRouteSpot[] = useMemo(() => {
    // 优先：若外部显式传入静态打卡点（如单条对话内嵌地图），以传入的专属点位为准
    if (propSpots && propSpots.length > 0) {
      return propSpots;
    }
    if (workspaceDays.length > 0) {
      if (selectedDay > 0) {
        const dayObj = workspaceDays.find((d) => d.day === selectedDay);
        return dayObj ? dayObj.spots : [];
      } else if (selectedDay === 0 || selectedDay === -1) {
        // 总览模式：聚合所有天
        return workspaceDays.flatMap((d) => d.spots);
      }
    }
    return [];
  }, [workspaceDays, selectedDay, propSpots]);

  // 3. 计算所有打卡点真实地理坐标
  const routePoints = useMemo(() => {
    return currentSpots.map((spot, idx) => {
      const coord = getSpotCoordinates(spot.name, city, idx);
      return {
        ...spot,
        ...coord,
        index: idx + 1,
      };
    });
  }, [currentSpots, city]);

  // 3.1 查找全局选中的 POI 对象以供浮动卡片展示 (纯派生状态，绝不触发循环 setState)
  const selectedPoi: WorkspaceSpotNode | null = useMemo(() => {
    if (!activeSpotId) return null;
    for (const d of workspaceDays) {
      const found = d.spots.find((sp) => sp.id === activeSpotId);
      if (found) return found;
    }
    const fallback = routePoints.find(
      (sp) => sp.id === activeSpotId || sp.name === activeSpotId,
    );
    if (fallback) {
      return {
        address: fallback.address || `${city}市区`,
        city,
        coverImage:
          fallback.coverImage ||
          '/images/attractions/hangzhou/hangzhou-west-lake.webp',
        id: fallback.id || activeSpotId,
        lat: fallback.lat,
        lng: fallback.lng,
        name: fallback.name,
        openingHours: fallback.openHours || '全天开放',
        priceText:
          fallback.priceText ||
          (fallback.ticketType === 'free' ? '免费' : '收费'),
        rating: fallback.rating || 4.8,
        recommendedDuration: fallback.durationText || '1-2小时',
        reviewCount: fallback.reviewCount || 520,
        summary: fallback.description || '',
        tags: ['必游', '推荐'],
        ticketType: fallback.ticketType || 'free',
      };
    }
    return null;
  }, [activeSpotId, workspaceDays, routePoints, city]);

  // 4. 计算分段路书导航段落 (Legs: 点A -> 点B, 点B -> 点C)
  const routeLegs = useMemo(() => {
    if (routePoints.length < 2) return [];

    const legs = [];
    for (let i = 0; i < routePoints.length - 1; i++) {
      const from = routePoints[i];
      const to = routePoints[i + 1];
      const distKm = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng);
      const durationMins = estimateDurationMinutes(distKm, mode);
      const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng);

      legs.push({
        amapUrl: generateAmapRouteUrl(
          from,
          to,
          city,
          mode === 'driving' ? 'car' : mode === 'transit' ? 'bus' : 'walk',
        ),
        baiduUrl: generateBaiduRouteUrl(
          from,
          to,
          city,
          mode === 'driving'
            ? 'driving'
            : mode === 'transit'
              ? 'transit'
              : 'walking',
        ),
        bearing,
        distanceKm: distKm,
        durationMins,
        durationText: formatMinutesText(durationMins),
        from,
        index: i + 1,
        tencentUrl: generateTencentRouteUrl(
          from,
          to,
          city,
          mode === 'driving' ? 'drive' : mode === 'transit' ? 'bus' : 'walk',
        ),
        to,
      });
    }
    return legs;
  }, [routePoints, mode, city]);

  // 5. 计算全程总里程与总耗时
  const totalMetrics = useMemo(() => {
    if (routeLegs.length === 0) {
      return { totalKm: 8, totalMinutes: 30, totalTimeText: '约 30 分钟' };
    }
    const totalKm = Number(
      routeLegs.reduce((acc, leg) => acc + leg.distanceKm, 0).toFixed(1),
    );
    const totalMinutes = routeLegs.reduce(
      (acc, leg) => acc + leg.durationMins,
      0,
    );
    return {
      totalKm,
      totalMinutes,
      totalTimeText: formatMinutesText(totalMinutes),
    };
  }, [routeLegs]);

  // 6. 监听地图容器 resize 变化，确保拖拽分栏或折叠时 Leaflet 立即平滑刷新视窗尺寸
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, []);

  // 7.1 初始化 Leaflet 实例与底图 (挂载时仅执行一次)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const centerPos: [number, number] =
          routePoints.length > 0
            ? [routePoints[0].lat, routePoints[0].lng]
            : [34.3416, 108.9398];

        const map = L.map(mapContainerRef.current, {
          attributionControl: false,
          center: centerPos,
          zoom: 12,
          zoomControl: false,
        });
        mapInstanceRef.current = map;

        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

        const tileUrls = {
          'amap-satellite':
            'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
          'amap-street':
            'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
          cartodb:
            'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        };

        const subdomains = tileType.startsWith('amap')
          ? ['1', '2', '3', '4']
          : ['a', 'b', 'c', 'd'];
        const baseLayer = L.tileLayer(tileUrls[tileType], {
          maxZoom: 18,
          minZoom: 3,
          subdomains,
        }).addTo(map);
        tileLayerRef.current = baseLayer;

        if (tileType === 'amap-satellite') {
          const overlay = L.tileLayer(
            'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8',
            {
              maxZoom: 18,
              subdomains: ['1', '2', '3', '4'],
            },
          ).addTo(map);
          overlayLayerRef.current = overlay;
        }
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 7.2 底图类型切换
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current as never);
        tileLayerRef.current = null;
      }
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current as never);
        overlayLayerRef.current = null;
      }

      const tileUrls = {
        'amap-satellite':
          'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
        'amap-street':
          'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
        cartodb:
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      };

      const subdomains = tileType.startsWith('amap')
        ? ['1', '2', '3', '4']
        : ['a', 'b', 'c', 'd'];
      const baseLayer = L.tileLayer(tileUrls[tileType], {
        maxZoom: 18,
        minZoom: 3,
        subdomains,
      }).addTo(map);
      tileLayerRef.current = baseLayer;

      if (tileType === 'amap-satellite') {
        const overlay = L.tileLayer(
          'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8',
          {
            maxZoom: 18,
            subdomains: ['1', '2', '3', '4'],
          },
        ).addTo(map);
        overlayLayerRef.current = overlay;
      }
    });
  }, [tileType]);

  // 7.3 景点标点、中点通勤气泡与路线 Polyline 渲染
  useEffect(() => {
    if (routePoints.length === 0) return;

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // 清理旧标点与标记
      markersRef.current.forEach((m) => map.removeLayer(m));
      markersRef.current = [];

      // 清理旧路线
      if (bgPolylineRef.current) {
        map.removeLayer(bgPolylineRef.current);
        bgPolylineRef.current = null;
      }
      if (fullPolylineRef.current) {
        map.removeLayer(fullPolylineRef.current);
        fullPolylineRef.current = null;
      }

      const latlngs: [number, number][] = [];
      const markers: LeafletMarker[] = [];

      routePoints.forEach((pt, idx) => {
        const pos: [number, number] = [pt.lat, pt.lng];
        latlngs.push(pos);

        const isFirst = idx === 0;
        const isLast = idx === routePoints.length - 1;
        const bgClass = isFirst
          ? 'bg-emerald-700 text-white ring-4 ring-emerald-200/80 shadow-emerald-900/30'
          : isLast
            ? 'bg-amber-600 text-white ring-4 ring-amber-200/80 shadow-amber-900/30'
            : 'bg-stone-900 text-white ring-2 ring-white/90 shadow-stone-900/30';

        const markerHtml = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${bgClass} font-black text-xs shadow-lg border-2 border-white transition-all hover:scale-125 cursor-pointer">
            ${pt.index}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: markerHtml,
          iconAnchor: [14, 14],
          iconSize: [28, 28],
        });

        const marker = L.marker(pos, { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setActiveSpotIndex(idx);
          if (pt.id) {
            setActiveSpotId(pt.id);
          } else {
            setActiveSpotId(pt.name);
          }
        });

        markers.push(marker);
      });

      // 绘制真实折线路径 Polyline
      if (latlngs.length > 1) {
        bgPolylineRef.current = L.polyline(latlngs, {
          color: '#ffffff',
          opacity: 0.95,
          weight: 8,
        }).addTo(map);

        fullPolylineRef.current = L.polyline(latlngs, {
          color: '#047857',
          dashArray: mode === 'walking' ? '6, 8' : undefined,
          opacity: 0.85,
          weight: 4.5,
        }).addTo(map);

        // 绘制折线中点通勤耗时标牌气泡 (对标携程路况标牌)
        for (let i = 0; i < routePoints.length - 1; i++) {
          const p1 = routePoints[i];
          const p2 = routePoints[i + 1];
          const mid = calculateMidPoint(p1.lat, p1.lng, p2.lat, p2.lng);
          const dist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
          const duration = estimateDurationMinutes(dist, mode);

          const badgeHtml = `
            <div class="px-2 py-0.5 rounded-full bg-white/95 border border-stone-300/80 shadow-xs text-[10px] font-bold text-stone-700 flex items-center gap-1 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform cursor-pointer">
              <span>${mode === 'walking' ? '🚶' : mode === 'transit' ? '🚌' : '🚗'}</span>
              <span>${duration}分钟</span>
            </div>
          `;
          const badgeIcon = L.divIcon({
            className: 'commute-mid-badge',
            html: badgeHtml,
            iconSize: [0, 0],
          });
          const badgeMarker = L.marker([mid.lat, mid.lng], {
            icon: badgeIcon,
          }).addTo(map);
          markers.push(badgeMarker);
        }

        map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
      } else if (latlngs.length === 1) {
        map.setView(latlngs[0], 13);
      }

      markersRef.current = markers;
    });
  }, [routePoints, mode, city, setActiveSpotId]);

  // 7.4 监听 activeSpotId 变更，平滑移动地图视角
  useEffect(() => {
    if (!activeSpotId || !mapInstanceRef.current) return;
    const target = routePoints.find((p) => p.id === activeSpotId);
    if (target) {
      mapInstanceRef.current.panTo([target.lat, target.lng], {
        animate: true,
        duration: 0.6,
      });
    }
  }, [activeSpotId, routePoints]);

  // 7.5 全屏切换与重算尺寸
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (isExpanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
      if (routePoints.length > 1) {
        import('leaflet').then((L) => {
          const latlngs: [number, number][] = routePoints.map((pt) => [
            pt.lat,
            pt.lng,
          ]);
          mapInstanceRef.current?.fitBounds(L.latLngBounds(latlngs), {
            padding: [40, 40],
          });
        });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [isExpanded, routePoints]);

  function handleFocusSpot(spotIndex: number) {
    setActiveSpotIndex(spotIndex);
    const pt = routePoints[spotIndex];
    if (pt && mapInstanceRef.current) {
      mapInstanceRef.current.panTo([pt.lat, pt.lng], {
        animate: true,
        duration: 0.6,
      });
      if (pt.id) {
        setActiveSpotId(pt.id);
      }
    }
  }

  function handleFocusLeg(legIndex: number) {
    setActiveSpotIndex(legIndex);
    const leg = routeLegs[legIndex];
    if (leg && mapInstanceRef.current) {
      import('leaflet').then((L) => {
        const bounds = L.latLngBounds([
          [leg.from.lat, leg.from.lng],
          [leg.to.lat, leg.to.lng],
        ]);
        mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50] });
      });
    }
  }

  if (routePoints.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full min-h-[350px] bg-stone-100/70 rounded-3xl border border-stone-200 text-center p-6 ${className}`}
      >
        <Compass className="h-10 w-10 text-stone-400 mb-2 animate-pulse" />
        <p className="text-xs text-stone-500 font-medium">
          规划生成中或未选定打卡点，地图将自动呈现路线...
        </p>
      </div>
    );
  }

  const startSpot = routePoints[0] || { name: `${city}起点` };
  const endSpot = routePoints[routePoints.length - 1] || {
    name: `${city}终点`,
  };
  const viaPoints = routePoints.length > 2 ? routePoints.slice(1, -1) : [];

  const amapOverallUrl = generateAmapRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'car' : mode === 'transit' ? 'bus' : 'walk',
    viaPoints,
  );

  return (
    <div
      className={
        isExpanded
          ? `fixed inset-0 z-40 isolate flex flex-col bg-[#FAF7F0] shadow-2xl h-dvh w-screen overflow-hidden ${className}`
          : `relative z-0 isolate flex flex-col h-full overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all ${className}`
      }
    >
      {/* 顶栏 1: 资源分类筛选 (对标携程: [🏞️ 景点] [🏨 酒店] [🍴 美食] [🛍️ 购物] [✈️ 交通]) */}
      <div className="flex items-center justify-between border-b border-stone-200/80 bg-white/95 px-3.5 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            const isCatActive = activeCategory === cat.id;
            return (
              <button
                className={`
                  flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0
                  ${
                    isCatActive
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }
                `}
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                type="button"
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* 展开/全屏切换 */}
        <button
          aria-label={isExpanded ? '退出全屏' : '全屏地图'}
          className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer shrink-0"
          onClick={() => setIsExpanded(!isExpanded)}
          type="button"
        >
          {isExpanded ? (
            <Minimize2 className="h-3.5 w-3.5" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* 顶栏 2: 城市总览与交通模式/底图图层控制 */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/70 bg-[#FAF7F0] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-800">
            {city} ·{selectedDay > 0 ? ` 第 ${selectedDay} 天` : ' 全程总览'}
          </span>
          <span className="text-stone-400">|</span>
          <span className="text-emerald-700 font-semibold">
            {routePoints.length}站
          </span>
          <span className="text-stone-400">|</span>
          <span className="text-stone-500">{totalMetrics.totalKm}km</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 交通模式 */}
          <div className="flex rounded-lg bg-stone-200/70 p-0.5 text-[11px] font-bold">
            <button
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${mode === 'driving' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600'}`}
              onClick={() => setWorkspaceTransportMode('driving')}
              type="button"
            >
              驾车
            </button>
            <button
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${mode === 'transit' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600'}`}
              onClick={() => setWorkspaceTransportMode('transit')}
              type="button"
            >
              公交
            </button>
            <button
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${mode === 'walking' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-600'}`}
              onClick={() => setWorkspaceTransportMode('walking')}
              type="button"
            >
              步行
            </button>
          </div>

          {/* 底图样式 */}
          <select
            className="rounded-lg bg-stone-200/70 px-2 py-0.5 text-[11px] font-medium text-stone-700 outline-none cursor-pointer"
            onChange={(e) => setTileType(e.target.value as TileLayerType)}
            value={tileType}
          >
            <option value="amap-street">高德标准</option>
            <option value="amap-satellite">高德卫星</option>
            <option value="cartodb">艺术底图</option>
          </select>
        </div>
      </div>

      {/* 地图核心视窗 */}
      <div className="relative flex-1 min-h-[350px] w-full bg-stone-100 overflow-hidden">
        <div className="h-full w-full" ref={mapContainerRef} />

        {/* 选点详情浮动卡片 (对标携程底部浮层) */}
        {selectedPoi && (
          <FloatingPoiCard
            city={city}
            onClose={() => setActiveSpotId(null)}
            spot={selectedPoi}
          />
        )}
      </div>

      {/* 底部打卡点快捷胶囊 & 全程高德导航 */}
      <div className="flex items-center justify-between gap-2 border-t border-stone-200/80 bg-white px-3.5 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {routePoints.map((spot, i) => (
            <button
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSpotIndex === i
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              key={`${spot.name}-${i}`}
              onClick={() => handleFocusSpot(i)}
              type="button"
            >
              <span className="text-[10px] opacity-80">#{i + 1}</span>
              <span>{spot.name}</span>
            </button>
          ))}
        </div>

        <a
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-1 text-xs font-bold text-white transition-colors shadow-2xs shrink-0"
          href={amapOverallUrl}
          rel="noreferrer"
          target="_blank"
        >
          <span>高德导航</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
