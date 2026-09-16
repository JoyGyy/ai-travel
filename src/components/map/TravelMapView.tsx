'use client';

import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from 'leaflet';
import type React from 'react';
import type { ParsedRouteSpot } from '@/lib/map/route-parser';
import type { WorkspaceSpotNode } from '@/stores/itineraryWorkspace';
import {
  Compass,
  ExternalLink,
  Maximize2,
  Minimize2,
  PanelRightClose,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  calculateBearing,
  calculateDistanceKm,
  calculateMidPoint,
  calculateNormalOffset,
  CITY_COORDINATES,
  estimateDurationMinutes,
  formatMinutesText,
  generateAmapRouteUrl,
  generateAmapSpotUrl,
  generateBaiduRouteUrl,
  generateBaiduSpotUrl,
  generateSmoothRoutePolyline,
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
  onToggleCollapse?: () => void;
  spots?: ParsedRouteSpot[];
}

type TileLayerType = 'amap-street' | 'amap-satellite';

export function TravelMapView({
  city: propCity,
  className = '',
  initialMode = 'driving',
  onToggleCollapse,
  spots: propSpots = [],
}: TravelMapViewProps): React.JSX.Element | null {
  // 1. 读取工作台状态
  const workspaceCity = useItineraryWorkspaceStore((s) => s.city);
  const workspaceDays = useItineraryWorkspaceStore((s) => s.days);
  const selectedDay = useItineraryWorkspaceStore((s) => s.selectedDay);
  const setSelectedDay = useItineraryWorkspaceStore((s) => s.setSelectedDay);
  const activeSpotId = useItineraryWorkspaceStore((s) => s.activeSpotId);
  const setActiveSpotId = useItineraryWorkspaceStore((s) => s.setActiveSpotId);
  const workspaceTransportMode = useItineraryWorkspaceStore(
    (s) => s.transportMode,
  );
  const setWorkspaceTransportMode = useItineraryWorkspaceStore(
    (s) => s.setTransportMode,
  );

  const city = propCity || workspaceCity || '杭州';
  const mode = workspaceTransportMode || initialMode;

  const [tileType, setTileType] = useState<TileLayerType>('amap-street');
  const [activeSpotIndex, setActiveSpotIndex] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showItineraryDrawer, setShowItineraryDrawer] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const bgPolylineRef = useRef<LeafletPolyline | null>(null);
  const fullPolylineRef = useRef<LeafletPolyline | null>(null);
  const flowPolylineRef = useRef<LeafletPolyline | null>(null);
  const tileLayerRef = useRef<unknown>(null);
  const overlayLayerRef = useRef<unknown>(null);

  // 2. 根据工作台多天筛选或 props 汇总打卡点
  const currentSpots: ParsedRouteSpot[] = useMemo(() => {
    // 优先：若工作台多日状态中有数据且用户正在查看特定天数，以该天打卡点为准联动
    if (workspaceDays.length > 0) {
      if (selectedDay > 0) {
        const dayObj = workspaceDays.find((d) => d.day === selectedDay);
        if (dayObj && dayObj.spots.length > 0) {
          return dayObj.spots;
        }
      } else if (selectedDay === 0 || selectedDay === -1) {
        const allSpots = workspaceDays.flatMap((d) => d.spots);
        if (allSpots.length > 0) {
          return allSpots;
        }
      }
    }
    // 降级：外部显式传入静态打卡点（如单条对话内嵌地图或初始解析结果）
    if (propSpots && propSpots.length > 0) {
      return propSpots;
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

  // 7.1 初始化 Leaflet 实例与底图 (挂载时执行)
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const cityCoord = CITY_COORDINATES[city] || {
          lat: 30.2741,
          lng: 120.1551,
        };
        const centerPos: [number, number] =
          routePoints.length > 0
            ? [routePoints[0].lat, routePoints[0].lng]
            : [cityCoord.lat, cityCoord.lng];

        const map = L.map(mapContainerRef.current, {
          attributionControl: false,
          center: centerPos,
          zoom: routePoints.length > 0 ? 12 : 11,
          zoomControl: false,
        });
        mapInstanceRef.current = map;

        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map);

        const tileUrls: Record<TileLayerType, string> = {
          'amap-satellite':
            'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
          'amap-street':
            'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
        };

        const subdomains = ['1', '2', '3', '4'];
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

        setIsMapReady(true);
        setTimeout(() => {
          map.invalidateSize();
        }, 150);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setIsMapReady(false);
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

      const tileUrls: Record<TileLayerType, string> = {
        'amap-satellite':
          'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
        'amap-street':
          'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
      };

      const subdomains = ['1', '2', '3', '4'];
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

  // 7.3 景点标点、中点通勤气泡与路线 Polyline 渲染 (确保在 isMapReady 就绪后平滑渲染)
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current) return;

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
      if (flowPolylineRef.current) {
        map.removeLayer(flowPolylineRef.current);
        flowPolylineRef.current = null;
      }

      // 若当前无打卡点，平滑复位到城市中心
      if (routePoints.length === 0) {
        const cityCoord = CITY_COORDINATES[city] || {
          lat: 30.2741,
          lng: 120.1551,
        };
        map.flyTo([cityCoord.lat, cityCoord.lng], 11, {
          duration: 0.8,
          easeLinearity: 0.25,
        });
        return;
      }

      const latlngs: [number, number][] = [];
      const markers: LeafletMarker[] = [];

      routePoints.forEach((pt, idx) => {
        const pos: [number, number] = [pt.lat, pt.lng];
        latlngs.push(pos);

        const isFirst = idx === 0;
        const isLast = idx === routePoints.length - 1;
        const isSelected =
          activeSpotId === pt.id ||
          activeSpotId === pt.name ||
          activeSpotIndex === idx;

        const bgClass = isFirst
          ? 'bg-emerald-700 text-white ring-4 ring-emerald-200/90 shadow-emerald-900/30'
          : isLast
            ? 'bg-amber-600 text-white ring-4 ring-amber-200/90 shadow-amber-900/30'
            : 'bg-stone-900 text-white ring-2 ring-white/90 shadow-stone-900/30';

        const markerHtml = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${bgClass} font-black text-xs shadow-lg border-2 border-white transition-all cursor-pointer ${
            isSelected
              ? 'scale-125 ring-4 ring-emerald-400 z-50'
              : 'hover:scale-115'
          }">
            ${pt.index}
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: markerHtml,
          iconAnchor: [14, 14],
          iconSize: [28, 28],
        });

        const marker = L.marker(pos, {
          icon: customIcon,
          zIndexOffset: isSelected ? 1000 : idx + 10,
        }).addTo(map);

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

      // 绘制平滑贝塞尔曲线路径 Polyline (告别生硬直戳城市的直线)
      if (latlngs.length > 1) {
        const smoothLatLngs = generateSmoothRoutePolyline(routePoints, 0.08);

        // 1. 底层白色轮廓垫底
        bgPolylineRef.current = L.polyline(smoothLatLngs, {
          color: '#ffffff',
          opacity: 0.95,
          weight: 7,
        }).addTo(map);

        // 2. 核心主色调路线
        const routeColor =
          mode === 'walking'
            ? '#059669'
            : mode === 'transit'
              ? '#0284c7'
              : '#047857';

        fullPolylineRef.current = L.polyline(smoothLatLngs, {
          color: routeColor,
          opacity: 0.85,
          weight: 4.5,
        }).addTo(map);

        // 3. 流动蚂蚁线光效 (带沿线行进生命力动效)
        flowPolylineRef.current = L.polyline(smoothLatLngs, {
          className: 'flowing-route-dash',
          color: '#a7f3d0',
          dashArray: '8, 12',
          opacity: 0.95,
          weight: 2.5,
        }).addTo(map);

        // 绘制折线中点通勤耗时标牌气泡 (垂直法线避让 + 智能抽稀，彻底杜绝重合黑块)
        for (let i = 0; i < routePoints.length - 1; i++) {
          const p1 = routePoints[i];
          const p2 = routePoints[i + 1];
          const dist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng);
          const duration = estimateDurationMinutes(dist, mode);

          // 智能抽稀避让：当景点较多 (>=4) 且两点直线距离非常近 (<1.2km) 时，默认隐藏常驻气泡，防止与标点踩踏
          const isLegActive = activeSpotIndex === i;
          if (routePoints.length >= 4 && dist < 1.2 && !isLegActive) {
            continue;
          }

          // 垂直法线偏移：将气泡从路线上垂直外移，彻底避开折线本身与端点标记
          const offsetPos = calculateNormalOffset(
            p1.lat,
            p1.lng,
            p2.lat,
            p2.lng,
            0.08,
          );

          const badgeHtml = `
            <div class="px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs border border-stone-200/90 shadow-sm text-[10px] font-bold text-stone-700 flex items-center gap-1.5 whitespace-nowrap -translate-x-1/2 -translate-y-1/2 hover:scale-110 hover:border-emerald-500 hover:text-emerald-800 transition-all cursor-pointer">
              <span>${mode === 'walking' ? '🚶' : mode === 'transit' ? '🚌' : '🚗'}</span>
              <span>${duration}分钟</span>
              <span class="text-[9px] text-stone-400 font-normal">(${dist}km)</span>
            </div>
          `;
          const badgeIcon = L.divIcon({
            className: 'commute-mid-badge',
            html: badgeHtml,
            iconSize: [0, 0],
          });
          const badgeMarker = L.marker([offsetPos.lat, offsetPos.lng], {
            icon: badgeIcon,
            zIndexOffset: isLegActive ? 900 : 200,
          }).addTo(map);

          badgeMarker.on('click', () => {
            handleFocusLeg(i);
          });

          markers.push(badgeMarker);
        }

        map.flyToBounds(L.latLngBounds(latlngs), {
          duration: 0.9,
          easeLinearity: 0.25,
          padding: [45, 45],
        });
      } else if (latlngs.length === 1) {
        map.flyTo(latlngs[0], 13, { duration: 0.8, easeLinearity: 0.25 });
      }

      markersRef.current = markers;
    });
  }, [
    routePoints,
    mode,
    city,
    isMapReady,
    setActiveSpotId,
    activeSpotIndex,
    activeSpotId,
  ]);

  // 7.4 监听 activeSpotId 变更，平滑移动地图视角 (flyTo 代替 panTo，带来沉浸式无人机航拍级俯冲运镜)
  useEffect(() => {
    if (!activeSpotId || !mapInstanceRef.current) return;
    const target = routePoints.find(
      (p) => p.id === activeSpotId || p.name === activeSpotId,
    );
    if (target) {
      mapInstanceRef.current.flyTo(
        [target.lat, target.lng],
        Math.max(mapInstanceRef.current.getZoom(), 13.5),
        {
          duration: 0.8,
          easeLinearity: 0.25,
        },
      );
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
          mapInstanceRef.current?.flyToBounds(L.latLngBounds(latlngs), {
            duration: 0.8,
            easeLinearity: 0.25,
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
      mapInstanceRef.current.flyTo(
        [pt.lat, pt.lng],
        Math.max(mapInstanceRef.current.getZoom(), 13.5),
        {
          duration: 0.8,
          easeLinearity: 0.25,
        },
      );
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
        mapInstanceRef.current?.flyToBounds(bounds, {
          duration: 0.8,
          easeLinearity: 0.25,
          padding: [55, 55],
        });
      });
    }
  }

  const startSpot = routePoints[0] || { name: `${city}市中心` };
  const endSpot = routePoints[routePoints.length - 1] || startSpot;
  const viaPoints = routePoints.length > 2 ? routePoints.slice(1, -1) : [];

  const amapOverallUrl =
    routePoints.length > 0
      ? generateAmapRouteUrl(
          startSpot,
          endSpot,
          city,
          mode === 'driving' ? 'car' : mode === 'transit' ? 'bus' : 'walk',
          viaPoints,
        )
      : `https://uri.amap.com/search?keyword=${encodeURIComponent(city)}&city=${encodeURIComponent(city)}`;

  return (
    <div
      className={
        isExpanded
          ? `fixed inset-0 z-40 isolate flex flex-col bg-[#FAF7F0] shadow-2xl h-dvh w-screen overflow-hidden ${className}`
          : `relative z-0 isolate flex flex-col h-full overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all ${className}`
      }
    >
      {/* 动态流动路线与标点微动效样式 */}
      <style>{`
        @keyframes routeFlowDash {
          from {
            stroke-dashoffset: 24;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .flowing-route-dash {
          animation: routeFlowDash 1.2s linear infinite !important;
        }
        .commute-mid-badge {
          transition: transform 0.2s ease, opacity 0.2s ease;
        }
        .custom-map-pin {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>

      {/* 顶部控制栏: 城市与行程节点、多天切换、交通模式、底图与窗口控制 (单行极简集成) */}
      <div className="flex items-center justify-between border-b border-stone-200/80 bg-white/95 px-3 py-1.5 gap-2 text-xs select-none">
        {/* 左侧：城市与行程天数导航 */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar min-w-0">
          <div className="flex items-center gap-1.5 font-bold text-stone-800 shrink-0">
            <span>{city}</span>
            <span className="text-stone-300">·</span>
            <span className="text-emerald-700 font-semibold">
              {routePoints.length}站
            </span>
            {totalMetrics.totalKm > 0 && (
              <>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500 font-normal text-[11px]">
                  {totalMetrics.totalKm}km
                </span>
              </>
            )}
          </div>

          {/* 多日行程切换胶囊 */}
          {workspaceDays.length > 0 && (
            <div className="flex items-center gap-1 pl-2 border-l border-stone-200/80 shrink-0">
              <button
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                  selectedDay === 0
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
                onClick={() => setSelectedDay(0)}
                type="button"
              >
                全程
              </button>
              {workspaceDays.map((d) => (
                <button
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                    selectedDay === d.day
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                  }`}
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  type="button"
                >
                  D{d.day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：交通模式、底图切换、行程明细抽屉、全屏与收起 */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 交通模式 */}
          <div className="flex rounded-lg bg-stone-100 p-0.5 text-[11px] font-bold">
            <button
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                mode === 'driving'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              onClick={() => setWorkspaceTransportMode('driving')}
              type="button"
            >
              驾车
            </button>
            <button
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                mode === 'transit'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              onClick={() => setWorkspaceTransportMode('transit')}
              type="button"
            >
              公交
            </button>
            <button
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                mode === 'walking'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              onClick={() => setWorkspaceTransportMode('walking')}
              type="button"
            >
              步行
            </button>
          </div>

          {/* 底图样式 */}
          <select
            className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-medium text-stone-700 outline-none cursor-pointer border border-transparent hover:border-stone-200"
            onChange={(e) => setTileType(e.target.value as TileLayerType)}
            value={tileType}
          >
            <option value="amap-street">高德标准</option>
            <option value="amap-satellite">高德卫星</option>
          </select>

          {/* 查看行程明细悬浮抽屉开关 */}
          <button
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showItineraryDrawer
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
            onClick={() => setShowItineraryDrawer((prev) => !prev)}
            title={showItineraryDrawer ? '收起行程明细' : '查看详细行程明细'}
            type="button"
          >
            <span>📋</span>
            <span className="hidden sm:inline">明细</span>
            {routePoints.length > 0 && (
              <span
                className={`px-1.5 py-0.2 text-[10px] rounded-full font-black ${
                  showItineraryDrawer
                    ? 'bg-white/20 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {routePoints.length}
              </span>
            )}
          </button>

          {/* 展开/全屏切换 */}
          <button
            aria-label={isExpanded ? '退出全屏' : '全屏地图'}
            className="flex h-7 w-7 items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '退出全屏' : '全屏模式'}
            type="button"
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          {/* 收起右侧地图 */}
          {onToggleCollapse && !isExpanded && (
            <button
              aria-label="收起地图"
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer shrink-0"
              onClick={onToggleCollapse}
              title="收起地图"
              type="button"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 地图核心视窗 */}
      <div className="relative flex-1 min-h-[350px] w-full bg-stone-100 overflow-hidden">
        <div className="h-full w-full" ref={mapContainerRef} />

        {/* 无打卡点时的友好浮动徽章 */}
        {routePoints.length === 0 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md text-stone-600 text-xs font-medium pointer-events-none">
            <Compass className="h-4 w-4 text-emerald-700 animate-spin" />
            <span>高德底图已就绪，AI 生成规划后将自动连线呈现...</span>
          </div>
        )}

        {/* 选点详情浮动卡片 (对标携程底部浮层) */}
        {selectedPoi && (
          <FloatingPoiCard
            city={city}
            onClose={() => setActiveSpotId(null)}
            spot={selectedPoi}
          />
        )}

        {/* 悬浮行程明细抽屉 (解决中间栏过占地方问题，可随时一键呼出与收起) */}
        {showItineraryDrawer && (
          <div className="absolute inset-y-0 left-0 z-30 w-80 sm:w-96 max-w-[90%] bg-[#FDFBF7]/95 backdrop-blur-md border-r border-stone-200/90 shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-left-4">
            <div className="flex items-center justify-between border-b border-stone-200/80 p-3.5 bg-white/80">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold">
                  📋
                </span>
                <h3 className="text-sm font-bold text-stone-900 font-serif">
                  {selectedDay > 0
                    ? `第 ${selectedDay} 天行程明细`
                    : '全程行程总览'}
                </h3>
              </div>
              <button
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                onClick={() => setShowItineraryDrawer(false)}
                title="收起行程明细"
                type="button"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {workspaceDays.length === 0 && routePoints.length === 0 ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  <Compass className="h-8 w-8 mx-auto mb-2 opacity-40 animate-pulse" />
                  <p>AI 对话生成中，行程明细将自动同步呈现</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-stone-600 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 font-medium">
                    <span>当前共 {routePoints.length} 个打卡点</span>
                    <span className="text-emerald-800 font-bold">
                      总计 {totalMetrics.totalKm} km
                    </span>
                  </div>
                  {routePoints.map((spot, idx) => (
                    <div
                      className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                        activeSpotIndex === idx
                          ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-white/80 border-stone-200/70 hover:border-emerald-300'
                      }`}
                      key={`${spot.name}-${idx}`}
                      onClick={() => handleFocusSpot(idx)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-stone-800">
                            {spot.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-400">
                          建议 1-2 小时
                        </span>
                      </div>
                      {idx < routeLegs.length && (
                        <div className="mt-2 pt-2 border-t border-dashed border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                          <span>
                            {mode === 'walking'
                              ? '🚶 步行'
                              : mode === 'transit'
                                ? '🚌 公交'
                                : '🚗 驾车'}{' '}
                            {routeLegs[idx]?.distanceKm} km
                          </span>
                          <span className="text-emerald-700 font-semibold">
                            {routeLegs[idx]?.durationText}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部打卡点快捷胶囊 & 全程高德导航 */}
      <div className="flex items-center justify-between gap-2 border-t border-stone-200/80 bg-white px-3.5 py-2">
        {routePoints.length > 0 ? (
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
        ) : (
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-emerald-700" />
            <span>高德交互地图已联通 · 支持驾车/公交/步行实时路况导航</span>
          </div>
        )}

        <a
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-1 text-xs font-bold text-white transition-colors shadow-2xs shrink-0 ml-auto"
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
