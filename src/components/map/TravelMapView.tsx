'use client'

import type { Map as LeafletMap, Marker as LeafletMarker, Polyline as LeafletPolyline } from 'leaflet'
import type React from 'react'
import type { ParsedRouteSpot } from '@/lib/map/route-parser'
import {
  Car,
  Clock,
  Compass,
  ExternalLink,
  Footprints,
  LocateFixed,
  Maximize2,
  Minimize2,
  Navigation as NavigationIcon,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  calculateBearing,
  calculateDistanceKm,
  estimateDurationMinutes,
  formatMinutesText,
  generateAmapRouteUrl,
  generateAmapSpotUrl,
  generateBaiduRouteUrl,
  generateBaiduSpotUrl,
  generateTencentRouteUrl,
  generateTencentSpotUrl,
  getSpotCoordinates,
} from '@/lib/map/amap'
import 'leaflet/dist/leaflet.css'

export interface TravelMapViewProps {
  className?: string
  city: string
  initialMode?: 'driving' | 'transit' | 'walking'
  spots: ParsedRouteSpot[]
}

type TileLayerType = 'amap-street' | 'amap-satellite' | 'cartodb'

export function TravelMapView({
  city,
  className = '',
  initialMode = 'driving',
  spots,
}: TravelMapViewProps): React.JSX.Element | null {
  const [mode, setMode] = useState<'driving' | 'transit' | 'walking'>(initialMode)
  const [activeTab, setActiveTab] = useState<'map' | 'legs'>('map')
  const [tileType, setTileType] = useState<TileLayerType>('amap-street')
  const [activeSpotIndex, setActiveSpotIndex] = useState<number>(0)
  const [isExpanded, setIsExpanded] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const bgPolylineRef = useRef<LeafletPolyline | null>(null)
  const fullPolylineRef = useRef<LeafletPolyline | null>(null)
  const tileLayerRef = useRef<unknown>(null)
  const overlayLayerRef = useRef<unknown>(null)

  // 1. 计算所有打卡点真实地理坐标
  const routePoints = useMemo(() => {
    return spots.map((spot, idx) => {
      const coord = getSpotCoordinates(spot.name, city, idx)
      return {
        ...spot,
        ...coord,
        index: idx + 1,
      }
    })
  }, [spots, city])

  // 2. 计算分段路书导航段落 (Legs: 点A -> 点B, 点B -> 点C)
  const routeLegs = useMemo(() => {
    if (routePoints.length < 2)
      return []

    const legs = []
    for (let i = 0; i < routePoints.length - 1; i++) {
      const from = routePoints[i]
      const to = routePoints[i + 1]
      const distKm = calculateDistanceKm(from.lat, from.lng, to.lat, to.lng)
      const durationMins = estimateDurationMinutes(distKm, mode)
      const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng)

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
          mode === 'driving' ? 'driving' : mode === 'transit' ? 'transit' : 'walking',
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
      })
    }
    return legs
  }, [routePoints, mode, city])

  // 3. 计算全程总里程与总耗时
  const totalMetrics = useMemo(() => {
    if (routeLegs.length === 0) {
      return { totalKm: 8, totalMinutes: 30, totalTimeText: '约 30 分钟' }
    }
    const totalKm = Number(routeLegs.reduce((acc, leg) => acc + leg.distanceKm, 0).toFixed(1))
    const totalMinutes = routeLegs.reduce((acc, leg) => acc + leg.durationMins, 0)
    return {
      totalKm,
      totalMinutes,
      totalTimeText: formatMinutesText(totalMinutes),
    }
  }, [routeLegs])

  // 4.1 初始化 Leaflet 实例与底图 (挂载时仅执行一次)
  useEffect(() => {
    if (!mapContainerRef.current)
      return

    let isMounted = true

    import('leaflet').then((L) => {
      if (!isMounted || !mapContainerRef.current)
        return

      if (!mapInstanceRef.current) {
        const centerPos: [number, number] = routePoints.length > 0
          ? [routePoints[0].lat, routePoints[0].lng]
          : [34.3416, 108.9398]

        const map = L.map(mapContainerRef.current, {
          attributionControl: false,
          center: centerPos,
          zoom: 12,
          zoomControl: false,
        })
        mapInstanceRef.current = map

        L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(map)

        const tileUrls = {
          'amap-satellite': 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
          'amap-street': 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=7',
          'cartodb': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        }

        const subdomains = tileType.startsWith('amap') ? ['1', '2', '3', '4'] : ['a', 'b', 'c', 'd']
        const baseLayer = L.tileLayer(tileUrls[tileType], {
          maxZoom: 18,
          minZoom: 3,
          subdomains,
        }).addTo(map)
        tileLayerRef.current = baseLayer

        if (tileType === 'amap-satellite') {
          const overlay = L.tileLayer('https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8', {
            maxZoom: 18,
            subdomains: ['1', '2', '3', '4'],
          }).addTo(map)
          overlayLayerRef.current = overlay
        }
      }
    })

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
    // 地图容器仅在挂载时创建一次，后续底图与路线变化由下方独立 effect 响应式增量更新
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 4.2 底图类型切换 (平滑更换图层，不销毁地图容器)
  useEffect(() => {
    if (!mapInstanceRef.current)
      return

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current
      if (!map)
        return

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current as never)
        tileLayerRef.current = null
      }
      if (overlayLayerRef.current) {
        map.removeLayer(overlayLayerRef.current as never)
        overlayLayerRef.current = null
      }

      const tileUrls = {
        'amap-satellite': 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=6',
        'amap-street': 'https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&style=7',
        'cartodb': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      }

      const subdomains = tileType.startsWith('amap') ? ['1', '2', '3', '4'] : ['a', 'b', 'c', 'd']
      const baseLayer = L.tileLayer(tileUrls[tileType], {
        maxZoom: 18,
        minZoom: 3,
        subdomains,
      }).addTo(map)
      tileLayerRef.current = baseLayer

      if (tileType === 'amap-satellite') {
        const overlay = L.tileLayer('https://wprd0{s}.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scl=1&style=8', {
          maxZoom: 18,
          subdomains: ['1', '2', '3', '4'],
        }).addTo(map)
        overlayLayerRef.current = overlay
      }
    })
  }, [tileType])

  // 4.3 景点标点与路线更新 (纯增量图层更新，杜绝白屏与闪烁)
  useEffect(() => {
    if (routePoints.length === 0)
      return

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current
      if (!map)
        return

      // 清理旧标点
      markersRef.current.forEach(m => map.removeLayer(m))
      markersRef.current = []

      // 清理旧路线
      if (bgPolylineRef.current) {
        map.removeLayer(bgPolylineRef.current)
        bgPolylineRef.current = null
      }
      if (fullPolylineRef.current) {
        map.removeLayer(fullPolylineRef.current)
        fullPolylineRef.current = null
      }

      const latlngs: [number, number][] = []
      const markers: LeafletMarker[] = []

      routePoints.forEach((pt, idx) => {
        const pos: [number, number] = [pt.lat, pt.lng]
        latlngs.push(pos)

        const isFirst = idx === 0
        const isLast = idx === routePoints.length - 1
        const bgClass = isFirst
          ? 'bg-emerald-700 text-white ring-4 ring-emerald-200/80 shadow-emerald-900/30'
          : isLast
            ? 'bg-amber-600 text-white ring-4 ring-amber-200/80 shadow-amber-900/30'
            : 'bg-stone-900 text-white ring-2 ring-white/90 shadow-stone-900/30'

        const markerHtml = `
          <div class="relative flex items-center justify-center w-7 h-7 rounded-full ${bgClass} font-black text-xs shadow-lg border-2 border-white transition-all hover:scale-125 cursor-pointer">
            ${pt.index}
          </div>
        `

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: markerHtml,
          iconAnchor: [14, 14],
          iconSize: [28, 28],
        })

        const marker = L.marker(pos, { icon: customIcon }).addTo(map)
        marker.bindPopup(`
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; padding: 4px 6px; min-width: 170px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;">
              <span style="font-weight: 900; font-size: 14px; color: #047857;">#${pt.index} ${pt.name}</span>
              <span style="background: #ecfdf5; color: #047857; font-size: 10px; font-weight: bold; padding: 1px 6px; border-radius: 9999px;">
                ${isFirst ? '起点' : isLast ? '终点' : '途径'}
              </span>
            </div>
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 8px;">
              📍 所属城市：${city}
            </div>
            <div style="display: flex; gap: 4px; margin-top: 4px;">
              <a href="${generateAmapSpotUrl(pt, city)}" target="_blank" style="flex: 1; text-align: center; padding: 4px 6px; border-radius: 8px; background: #047857; color: #fff; font-size: 11px; font-weight: bold; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.1);">
                高德
              </a>
              <a href="${generateBaiduSpotUrl(pt, city)}" target="_blank" style="flex: 1; text-align: center; padding: 4px 6px; border-radius: 8px; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: bold; text-decoration: none; border: 1px solid #e5e7eb;">
                百度
              </a>
              <a href="${generateTencentSpotUrl(pt, city)}" target="_blank" style="flex: 1; text-align: center; padding: 4px 6px; border-radius: 8px; background: #f3f4f6; color: #374151; font-size: 11px; font-weight: bold; text-decoration: none; border: 1px solid #e5e7eb;">
                腾讯
              </a>
            </div>
          </div>
        `)

        marker.on('click', () => {
          setActiveSpotIndex(idx)
        })

        markers.push(marker)
      })
      markersRef.current = markers

      // 绘制真实折线路径 Polyline
      if (latlngs.length > 1) {
        bgPolylineRef.current = L.polyline(latlngs, {
          color: '#ffffff',
          opacity: 0.95,
          weight: 8,
        }).addTo(map)

        fullPolylineRef.current = L.polyline(latlngs, {
          color: '#047857',
          dashArray: mode === 'walking' ? '6, 8' : undefined,
          opacity: 0.85,
          weight: 4.5,
        }).addTo(map)

        map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36] })
      }
    })
  }, [routePoints, mode, city])

  // 4.4 监听全屏切换，自动触发 Leaflet 尺寸重算与视窗重绘
  useEffect(() => {
    if (!mapInstanceRef.current)
      return

    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    }
    else {
      document.body.style.overflow = ''
    }

    const timer1 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
      if (routePoints.length > 1) {
        import('leaflet').then((L) => {
          const latlngs: [number, number][] = routePoints.map(pt => [pt.lat, pt.lng])
          mapInstanceRef.current?.fitBounds(L.latLngBounds(latlngs), { padding: [48, 48] })
        })
      }
    }, 60)

    const timer2 = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize()
    }, 250)

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isExpanded, routePoints])

  // 聚焦具体景点
  function handleFocusSpot(index: number) {
    setActiveSpotIndex(index)
    const pt = routePoints[index]
    if (pt && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([pt.lat, pt.lng], 14, { duration: 0.8 })
      const marker = markersRef.current[index]
      if (marker) {
        marker.openPopup()
      }
    }
  }

  // 聚焦某一路段 (从 A 到 B)
  function handleFocusLeg(legIndex: number) {
    setActiveSpotIndex(legIndex)
    const leg = routeLegs[legIndex]
    if (leg && mapInstanceRef.current) {
      import('leaflet').then((L) => {
        const bounds = L.latLngBounds([
          [leg.from.lat, leg.from.lng],
          [leg.to.lat, leg.to.lng],
        ])
        mapInstanceRef.current?.fitBounds(bounds, { padding: [50, 50] })
      })
    }
  }

  if (routePoints.length === 0) {
    return null
  }

  const startSpot = routePoints[0] || { name: `${city}起点` }
  const endSpot = routePoints[routePoints.length - 1] || { name: `${city}终点` }
  const viaPoints = routePoints.length > 2 ? routePoints.slice(1, -1) : []

  // 全程导航：传入全部途经点，确保展示完整路线
  const amapOverallUrl = generateAmapRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'car' : mode === 'transit' ? 'bus' : 'walk',
    viaPoints,
  )
  const baiduOverallUrl = generateBaiduRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'driving' : mode === 'transit' ? 'transit' : 'walking',
    viaPoints,
  )
  const tencentOverallUrl = generateTencentRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'drive' : mode === 'transit' ? 'bus' : 'walk',
    viaPoints,
  )

  return (
    <div
      className={
        isExpanded
          ? `fixed inset-0 z-40 isolate flex flex-col bg-[#FAF7F0] shadow-2xl h-dvh w-screen overflow-hidden ${className}`
          : `relative z-0 isolate overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all ${className}`
      }
    >
      {/* 顶栏：城市总览、交通模式切换、底图切换与全屏视野 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200/80 bg-white/95 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-700 text-white font-bold shadow-sm shadow-emerald-800/20">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <span>{city}</span>
              <span className="text-xs font-normal text-stone-400">·</span>
              <span className="text-xs font-bold text-emerald-800">
                {routePoints.length}
                {' '}
                处景点真实路线规划
              </span>
            </h4>
            <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium mt-0.5">
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <NavigationIcon className="h-3 w-3" />
                全程 ~
                {totalMetrics.totalKm}
                {' '}
                km
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-700 font-semibold">
                <Clock className="h-3 w-3" />
                {totalMetrics.totalTimeText}
              </span>
            </div>
          </div>
        </div>

        {/* 控制区：Tab 切换、交通方式胶囊、底图切换与展开 */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tab 切换：地图 / 分段路书 */}
          <div className="flex items-center rounded-xl bg-stone-100 p-0.5 border border-stone-200/70 text-xs font-bold">
            <button
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'map' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setActiveTab('map')}
              type="button"
            >
              🗺️ 真实地图
            </button>
            <button
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                activeTab === 'legs' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setActiveTab('legs')}
              type="button"
            >
              📋 分段导航 (
              {routeLegs.length}
              段)
            </button>
          </div>

          {/* 交通工具切换 */}
          <div className="flex items-center gap-0.5 rounded-xl bg-stone-100 p-0.5 border border-stone-200/70">
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'driving' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setMode('driving')}
              title="自驾驾车"
              type="button"
            >
              <Car className="h-3 w-3" />
              <span className="hidden sm:inline">驾车</span>
            </button>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'transit' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setMode('transit')}
              title="公共交通/地铁"
              type="button"
            >
              <Zap className="h-3 w-3" />
              <span className="hidden sm:inline">公交</span>
            </button>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'walking' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setMode('walking')}
              title="步行漫游"
              type="button"
            >
              <Footprints className="h-3 w-3" />
              <span className="hidden sm:inline">步行</span>
            </button>
          </div>

          {/* 底图样式切换 */}
          <select
            aria-label="选择地图样式图层"
            className="bg-stone-100 border border-stone-200 text-stone-700 text-xs font-medium rounded-xl px-2 py-1 outline-hidden cursor-pointer"
            onChange={e => setTileType(e.target.value as TileLayerType)}
            value={tileType}
          >
            <option value="amap-street">高德街道</option>
            <option value="amap-satellite">高德实景</option>
            <option value="cartodb">Carto艺术</option>
          </select>

          {/* 展开/退出全屏视野 */}
          <button
            aria-label={isExpanded ? '退出地图全屏 (ESC)' : '展开地图全屏视野'}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isExpanded
                ? 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 ring-2 ring-emerald-300'
                : 'bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-200'
            }`}
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? '退出地图全屏 (ESC)' : '展开地图全屏视野'}
            type="button"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>退出全屏 (ESC)</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">全屏视野</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 主展示区：地图视图 vs 分段路书视图 */}
      {activeTab === 'map' ? (
        <div className={`relative z-0 isolate ${isExpanded ? 'flex-1 min-h-0 w-full' : ''}`}>
          {/* Leaflet 地图容器 */}
          <div
            className={`w-full bg-stone-100 transition-all duration-300 ${
              isExpanded ? 'h-full w-full' : 'h-[380px] sm:h-[420px]'
            }`}
            ref={mapContainerRef}
          />
        </div>
      ) : (
        /* 分段路书列表视图 (Legs) */
        <div className={`divide-y divide-stone-100 overflow-y-auto bg-stone-50/50 p-3 sm:p-4 ${
          isExpanded ? 'flex-1 min-h-0 p-4 sm:p-6' : 'max-h-[420px]'
        }`}
        >
          <div className="text-xs font-bold text-stone-500 mb-3 px-1 flex items-center justify-between">
            <span>分段行程导航与接驳指南</span>
            <span>
              共
              {routeLegs.length}
              段路书
            </span>
          </div>

          <div className="space-y-2.5">
            {routeLegs.map((leg, i) => (
              <div
                className={`rounded-2xl border p-3.5 transition-all bg-white ${
                  activeSpotIndex === i
                    ? 'border-emerald-500 shadow-md ring-2 ring-emerald-100'
                    : 'border-stone-200/80 hover:border-stone-300'
                }`}
                key={leg.index}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-700 text-white text-xs font-black">
                      {leg.index}
                    </span>
                    <span className="text-xs font-bold text-stone-900">
                      {leg.from.name}
                      {' '}
                      ➔
                      {' '}
                      {leg.to.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="font-bold text-emerald-800">
                      ~
                      {leg.distanceKm}
                      km
                    </span>
                    <span className="text-stone-300">|</span>
                    <span className="font-semibold text-amber-700">{leg.durationText}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100 mt-2 text-xs">
                  <button
                    className="text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    onClick={() => {
                      setActiveTab('map')
                      handleFocusLeg(i)
                    }}
                    type="button"
                  >
                    <LocateFixed className="h-3.5 w-3.5" />
                    <span>在地图中聚焦</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <a
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                      href={leg.amapUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>高德</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <a
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-200 px-2 py-0.5 text-[11px] font-bold text-stone-700 hover:bg-stone-200 transition-colors"
                      href={leg.baiduUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>百度</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                    <a
                      className="inline-flex items-center gap-1 rounded-lg bg-stone-100 border border-stone-200 px-2 py-0.5 text-[11px] font-bold text-stone-700 hover:bg-stone-200 transition-colors"
                      href={leg.tencentUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>腾讯</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底栏：打卡点快速定位胶囊 & 第三方直达 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/80 bg-white/95 px-4 py-2.5 sm:px-5">
        {/* 打卡点快速切换 */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 max-w-full sm:max-w-md no-scrollbar">
          <span className="text-[11px] font-bold text-stone-400 shrink-0">打卡点:</span>
          {routePoints.map((spot, i) => (
            <button
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeSpotIndex === i
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              key={`${spot.name}-${spot.lat}-${spot.lng}`}
              onClick={() => {
                setActiveTab('map')
                handleFocusSpot(i)
              }}
              type="button"
            >
              <span className="text-[10px] opacity-80">
                #
                {i + 1}
              </span>
              <span>{spot.name}</span>
            </button>
          ))}
        </div>

        {/* 全程真实导航直达链接 (带完整途经点) */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 text-xs font-bold text-white transition-colors shadow-sm shadow-emerald-800/20"
            href={amapOverallUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>高德全程导航</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1.5 text-xs font-bold text-stone-700 transition-colors shadow-2xs"
            href={baiduOverallUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>百度地图</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 px-2.5 py-1.5 text-xs font-bold text-stone-700 transition-colors shadow-2xs"
            href={tencentOverallUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>腾讯地图</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  )
}
