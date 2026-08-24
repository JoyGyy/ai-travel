'use client'

import type { Map as LeafletMap, Marker as LeafletMarker, Polyline as LeafletPolyline } from 'leaflet'
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
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

interface TravelMapViewProps {
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
}: TravelMapViewProps) {
  const [mode, setMode] = useState<'driving' | 'transit' | 'walking'>(initialMode)
  const [activeTab, setActiveTab] = useState<'map' | 'legs'>('map')
  const [tileType, setTileType] = useState<TileLayerType>('amap-street')
  const [activeSpotIndex, setActiveSpotIndex] = useState<number>(0)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCameraFollow, setIsCameraFollow] = useState(true)

  // 模拟导航演播状态
  const [isSimulating, setIsSimulating] = useState(false)
  const [simProgress, setSimProgress] = useState(0) // 0 - 100
  const [simSpeed, setSimSpeed] = useState<number>(1) // 1x, 2x, 4x
  const [simLegIndex, setSimLegIndex] = useState(0)
  const [arrivedSpotNotification, setArrivedSpotNotification] = useState<string | null>(null)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const markersRef = useRef<LeafletMarker[]>([])
  const bgPolylineRef = useRef<LeafletPolyline | null>(null)
  const fullPolylineRef = useRef<LeafletPolyline | null>(null)
  const passedPolylineRef = useRef<LeafletPolyline | null>(null)
  const simVehicleMarkerRef = useRef<LeafletMarker | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const notifTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
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
      if (passedPolylineRef.current) {
        map.removeLayer(passedPolylineRef.current)
        passedPolylineRef.current = null
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

        passedPolylineRef.current = L.polyline([], {
          color: '#10b981',
          opacity: 0.95,
          weight: 5,
        }).addTo(map)

        map.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36] })
      }
    })
  }, [routePoints, mode, city])

  // 5. 模拟导航演播动画控制器 (Dynamic Route Simulation with Camera Follow & Heading)
  useEffect(() => {
    if (!isSimulating || routePoints.length < 2 || !mapInstanceRef.current)
      return

    import('leaflet').then((L) => {
      const map = mapInstanceRef.current
      if (!map)
        return

      let currentLeg = simLegIndex
      let progressInLeg = (simProgress % (100 / Math.max(routeLegs.length, 1))) * routeLegs.length

      // 创建移动漫游载具 Marker（包含车辆/小人与朝向指示）
      const updateVehicleMarker = (lat: number, lng: number, heading: number) => {
        const iconSymbol = mode === 'driving' ? '🚗' : mode === 'transit' ? '🚌' : '🚶'
        const vehicleHtml = `
          <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-emerald-800 text-white font-bold text-base shadow-2xl ring-4 ring-emerald-300 transition-transform duration-75" style="transform: rotate(${heading}deg);">
            <span>${iconSymbol}</span>
            <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-amber-300"></div>
          </div>
        `
        const vehicleIcon = L.divIcon({
          className: 'sim-vehicle-pin',
          html: vehicleHtml,
          iconAnchor: [18, 18],
          iconSize: [36, 36],
        })

        if (!simVehicleMarkerRef.current) {
          simVehicleMarkerRef.current = L.marker([lat, lng], {
            icon: vehicleIcon,
            zIndexOffset: 1000,
          }).addTo(map)
        }
        else {
          simVehicleMarkerRef.current.setIcon(vehicleIcon)
          simVehicleMarkerRef.current.setLatLng([lat, lng])
        }
      }

      const step = () => {
        if (!isSimulating)
          return

        // 根据倍速步进
        progressInLeg += 0.35 * simSpeed
        if (progressInLeg >= 100) {
          progressInLeg = 0
          currentLeg += 1

          if (currentLeg < routePoints.length) {
            const arrivedSpot = routePoints[currentLeg]?.name
            if (arrivedSpot) {
              setArrivedSpotNotification(`🎉 已顺利抵达【${arrivedSpot}】！`)
              if (notifTimeoutRef.current) {
                clearTimeout(notifTimeoutRef.current)
              }
              notifTimeoutRef.current = setTimeout(() => {
                setArrivedSpotNotification(null)
                notifTimeoutRef.current = null
              }, 3000)
            }
          }

          if (currentLeg >= routeLegs.length) {
            // 模拟演播完成
            setIsSimulating(false)
            setSimProgress(100)
            setSimLegIndex(0)
            setArrivedSpotNotification(`🏁 全程模拟导航完成，已抵达终点【${routePoints[routePoints.length - 1]?.name}】！`)
            if (simVehicleMarkerRef.current) {
              map.removeLayer(simVehicleMarkerRef.current)
              simVehicleMarkerRef.current = null
            }
            return
          }
          setSimLegIndex(currentLeg)
          setActiveSpotIndex(currentLeg)
        }

        const fromPt = routePoints[currentLeg]
        const toPt = routePoints[currentLeg + 1]

        if (fromPt && toPt) {
          const ratio = progressInLeg / 100
          const curLat = fromPt.lat + (toPt.lat - fromPt.lat) * ratio
          const curLng = fromPt.lng + (toPt.lng - fromPt.lng) * ratio

          const currentBearing = calculateBearing(fromPt.lat, fromPt.lng, toPt.lat, toPt.lng)
          updateVehicleMarker(curLat, curLng, currentBearing)

          // 镜头平滑跟随
          if (isCameraFollow) {
            map.panTo([curLat, curLng], { animate: true, duration: 0.1 })
          }

          // 动态更新已行进轨迹 Polyline
          if (passedPolylineRef.current) {
            const passedPoints: [number, number][] = []
            for (let i = 0; i <= currentLeg; i++) {
              passedPoints.push([routePoints[i].lat, routePoints[i].lng])
            }
            passedPoints.push([curLat, curLng])
            passedPolylineRef.current.setLatLngs(passedPoints)
          }

          const overallProgress = Math.round(
            ((currentLeg + ratio) / Math.max(routeLegs.length, 1)) * 100,
          )
          setSimProgress(overallProgress)
        }

        animFrameRef.current = requestAnimationFrame(step)
      }

      animFrameRef.current = requestAnimationFrame(step)
    })

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (notifTimeoutRef.current) {
        clearTimeout(notifTimeoutRef.current)
        notifTimeoutRef.current = null
      }
    }
  }, [isSimulating, simSpeed, simLegIndex, simProgress, isCameraFollow, routePoints, routeLegs, mode])

  // 重设演播
  function handleResetSim() {
    setIsSimulating(false)
    setSimProgress(0)
    setSimLegIndex(0)
    setActiveSpotIndex(0)
    setArrivedSpotNotification(null)
    if (notifTimeoutRef.current) {
      clearTimeout(notifTimeoutRef.current)
      notifTimeoutRef.current = null
    }

    if (simVehicleMarkerRef.current && mapInstanceRef.current) {
      mapInstanceRef.current.removeLayer(simVehicleMarkerRef.current)
      simVehicleMarkerRef.current = null
    }

    if (passedPolylineRef.current) {
      passedPolylineRef.current.setLatLngs([])
    }

    if (mapInstanceRef.current && routePoints.length > 0) {
      const latlngs = routePoints.map(p => [p.lat, p.lng] as [number, number])
      import('leaflet').then((L) => {
        mapInstanceRef.current?.fitBounds(L.latLngBounds(latlngs), { padding: [36, 36] })
      })
    }
  }

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

  const amapOverallUrl = generateAmapRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'car' : mode === 'transit' ? 'bus' : 'walk',
  )
  const baiduOverallUrl = generateBaiduRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'driving' : mode === 'transit' ? 'transit' : 'walking',
  )
  const tencentOverallUrl = generateTencentRouteUrl(
    startSpot,
    endSpot,
    city,
    mode === 'driving' ? 'drive' : mode === 'transit' ? 'bus' : 'walk',
  )

  const activeLeg = routeLegs[simLegIndex]

  return (
    <div className={`overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all ${className}`}>
      {/* 顶栏：城市总览、交通模式切换与携程风格 Tab */}
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

        {/* 视图 Tab 与交通方式胶囊 */}
        <div className="flex items-center gap-2">
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
          <div className="hidden sm:flex items-center gap-0.5 rounded-xl bg-stone-100 p-0.5 border border-stone-200/70">
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'driving' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setMode('driving')}
              title="自驾驾车"
              type="button"
            >
              <Car className="h-3.5 w-3.5" />
              <span>自驾</span>
            </button>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'transit' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setMode('transit')}
              title="公共交通"
              type="button"
            >
              <NavigationIcon className="h-3.5 w-3.5" />
              <span>公交</span>
            </button>
            <button
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'walking' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
              onClick={() => setMode('walking')}
              title="徒步漫步"
              type="button"
            >
              <Footprints className="h-3.5 w-3.5" />
              <span>慢步</span>
            </button>
          </div>
        </div>
      </div>

      {/* 模式一：真实地理交互地图 + 高德级模拟导航 HUD */}
      {activeTab === 'map' && (
        <div className="relative w-full overflow-hidden bg-[#E5E3DF]">
          {/* 地图渲染容器 */}
          <div
            className={`w-full transition-all duration-300 ${isExpanded ? 'h-[460px] sm:h-[540px]' : 'h-[300px] sm:h-[350px]'}`}
            ref={mapContainerRef}
          />

          {/* 悬浮模拟导航 HUD 状态栏 (高德/携程沉浸导航风格) */}
          <div className="absolute top-2.5 left-2.5 right-2.5 z-[1000] flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/95 p-2 px-3.5 shadow-md border border-stone-200/90 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs shrink-0 ${isSimulating ? 'bg-emerald-700 text-white animate-pulse' : 'bg-emerald-100 text-emerald-800'}`}>
                {isSimulating ? <Zap className="h-4 w-4" /> : <NavigationIcon className="h-4 w-4" />}
              </div>
              <div className="text-xs min-w-0">
                {isSimulating ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-emerald-900">
                        正在前往
                        {' '}
                        {activeLeg?.to.name}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        (~
                        {activeLeg?.distanceKm}
                        km)
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 truncate mt-0.5">
                      从【
                      {activeLeg?.from.name}
                      】出发 · 第
                      {' '}
                      {simLegIndex + 1}
                      /
                      {routeLegs.length}
                      {' '}
                      段
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <span className="text-stone-800 font-bold truncate">
                      {simProgress === 100 ? '🎉 模拟导航已顺利抵达终点' : '高德真实路网 · 模拟导航漫游'}
                    </span>
                    <span className="text-[10px] text-stone-500">
                      支持倍速演播、镜头跟随与卫星实景切换
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 演播控制按钮群 */}
            <div className="flex items-center gap-1.5 shrink-0">
              {!isSimulating ? (
                <Button
                  className="h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs gap-1 cursor-pointer"
                  onClick={() => setIsSimulating(true)}
                  size="sm"
                  type="button"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>{simProgress > 0 && simProgress < 100 ? '继续导航' : '模拟导航'}</span>
                </Button>
              ) : (
                <Button
                  className="h-8 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs gap-1 cursor-pointer"
                  onClick={() => setIsSimulating(false)}
                  size="sm"
                  type="button"
                >
                  <Pause className="h-3.5 w-3.5 fill-white" />
                  <span>暂停</span>
                </Button>
              )}

              {simProgress > 0 && (
                <button
                  className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                  onClick={handleResetSim}
                  title="重设回到起点"
                  type="button"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}

              {/* 镜头跟随开关 */}
              <button
                className={`p-1.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                  isCameraFollow ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-stone-100 border-stone-200 text-stone-400'
                }`}
                onClick={() => setIsCameraFollow(prev => !prev)}
                title={isCameraFollow ? '镜头跟随开启' : '镜头跟随已关闭（可自由拖拽地图）'}
                type="button"
              >
                <LocateFixed className="h-3.5 w-3.5" />
              </button>

              {/* 倍速切换 */}
              <button
                className="px-2 py-1 rounded-lg bg-stone-100 border border-stone-200 text-[10px] font-black text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
                onClick={() => setSimSpeed(s => (s === 1 ? 2 : s === 2 ? 4 : 1))}
                title="切换演播倍速"
                type="button"
              >
                {simSpeed}
                x
              </button>
            </div>
          </div>

          {/* 实时到达打卡气泡弹窗 */}
          {arrivedSpotNotification && (
            <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-[1000] inline-flex items-center gap-1.5 rounded-full bg-emerald-900/90 text-white px-4 py-1.5 text-xs font-bold shadow-xl border border-emerald-500/50 backdrop-blur-md animate-fade-in-up">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>{arrivedSpotNotification}</span>
            </div>
          )}

          {/* 导航进度条 */}
          {isSimulating && (
            <div className="absolute top-[56px] left-3 right-3 z-[1000] h-1.5 rounded-full bg-stone-200/90 overflow-hidden shadow-xs">
              <div
                className="h-full bg-emerald-600 transition-all duration-150 rounded-full"
                style={{ width: `${simProgress}%` }}
              />
            </div>
          )}

          {/* 地图右下角图层与展开视窗控制工具栏 */}
          <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-2">
            {/* 图层切换 */}
            <div className="flex items-center rounded-xl bg-white/95 p-1 shadow-md border border-stone-200 text-[11px] font-bold">
              <button
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  tileType === 'amap-street' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
                onClick={() => setTileType('amap-street')}
                title="高德标准街道地图"
                type="button"
              >
                街道
              </button>
              <button
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  tileType === 'amap-satellite' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
                onClick={() => setTileType('amap-satellite')}
                title="真实高德遥感卫星实景"
                type="button"
              >
                卫星
              </button>
              <button
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  tileType === 'cartodb' ? 'bg-emerald-700 text-white' : 'text-stone-600 hover:bg-stone-100'
                }`}
                onClick={() => setTileType('cartodb')}
                title="手账清新艺术地图"
                type="button"
              >
                手账
              </button>
            </div>

            {/* 展开/全屏视窗切换 */}
            <button
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/95 shadow-md border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors self-end cursor-pointer"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? '收起地图高度' : '展开大图视野'}
              type="button"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* 模式二：携程风格分段路书导航列表 (Legs List) */}
      {activeTab === 'legs' && (
        <div className="p-4 sm:p-5 space-y-3 bg-[#FAF7F0] max-h-[380px] overflow-y-auto chat-scrollbar">
          <div className="flex items-center justify-between text-xs text-stone-500 font-medium px-1 mb-1">
            <span>
              共
              {' '}
              <b className="text-emerald-800 font-bold">{routeLegs.length}</b>
              {' '}
              段途经行程 · 点击可直接跳转第三方地图导航
            </span>
            <span className="text-stone-400">携程级导航指引</span>
          </div>

          {routeLegs.map((leg, idx) => {
            return (
              <div
                className="group relative rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-2xs hover:border-emerald-500/80 transition-all"
                key={leg.from.name + leg.to.name}
              >
                {/* 路段顶栏 */}
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-700 text-white text-[11px] font-black shadow-2xs">
                      {leg.index}
                    </span>
                    <span className="font-bold text-xs text-stone-900">
                      第
                      {' '}
                      {leg.index}
                      {' '}
                      段：
                      {leg.from.name}
                      {' '}
                      ➔
                      {' '}
                      {leg.to.name}
                    </span>
                  </div>

                  <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold" variant="outline">
                    {mode === 'driving' ? '🚗 自驾' : mode === 'transit' ? '🚌 公交' : '🚶 慢步'}
                    {' '}
                    ~
                    {leg.distanceKm}
                    {' '}
                    km ·
                    {' '}
                    {leg.durationText}
                  </Badge>
                </div>

                {/* 途径地点卡片 */}
                <div className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 mb-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-stone-800 font-bold">
                      <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                      <span className="truncate">
                        起点：
                        {leg.from.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-800 font-bold mt-1">
                      <span className="h-2 w-2 rounded-full bg-amber-600 shrink-0" />
                      <span className="truncate">
                        终点：
                        {leg.to.name}
                      </span>
                    </div>
                  </div>

                  <button
                    className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-[11px] font-bold text-stone-700 hover:bg-stone-100 hover:text-emerald-800 transition-colors shrink-0 cursor-pointer shadow-2xs"
                    onClick={() => {
                      setActiveTab('map')
                      setTimeout(() => handleFocusLeg(idx), 100)
                    }}
                    type="button"
                  >
                    在地图中聚焦
                  </button>
                </div>

                {/* 单段真实外部导航直达 */}
                <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[11px]">
                  <span className="text-stone-400 font-medium">第三方导航直达：</span>
                  <div className="flex items-center gap-2">
                    <a
                      className="inline-flex items-center gap-1 text-emerald-800 font-bold hover:underline"
                      href={leg.amapUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>高德导航</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-stone-300">|</span>
                    <a
                      className="inline-flex items-center gap-1 text-stone-600 font-bold hover:underline"
                      href={leg.baiduUrl}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <span>百度地图</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="text-stone-300">|</span>
                    <a
                      className="inline-flex items-center gap-1 text-stone-500 hover:underline"
                      href={leg.tencentUrl}
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
          })}
        </div>
      )}

      {/* 底部：打卡点快速水平导航条 + 全程导航快捷入口 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-stone-200/80 bg-white p-3 px-4 sm:px-5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          <span className="text-xs font-bold text-stone-400 shrink-0">打卡点:</span>
          {routePoints.map((spot, i) => (
            <button
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium shrink-0 transition-all cursor-pointer ${
                activeSpotIndex === i
                  ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
              key={spot.name}
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

        {/* 全程真实导航直达链接 */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
            href={amapOverallUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>高德全程导航</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-xl bg-stone-50 border border-stone-200 px-2.5 py-1 text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs"
            href={baiduOverallUrl}
            rel="noreferrer"
            target="_blank"
          >
            <span>百度地图</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          <a
            className="inline-flex items-center gap-1 rounded-xl bg-stone-50 border border-stone-200 px-2.5 py-1 text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors shadow-2xs"
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
