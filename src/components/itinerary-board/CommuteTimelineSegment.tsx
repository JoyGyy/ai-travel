'use client'

import type { WorkspaceLeg } from '@/stores/itineraryWorkspace'
import { Car, ChevronDown, ChevronUp, ExternalLink, Footprints, Train } from 'lucide-react'
import { useState } from 'react'

import {
  generateAmapRouteUrl,
  generateBaiduRouteUrl,
  generateTencentRouteUrl,
} from '@/lib/map/amap'
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace'

interface CommuteTimelineSegmentProps {
  city: string
  leg: WorkspaceLeg
}

export function CommuteTimelineSegment({ city, leg }: CommuteTimelineSegmentProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const transportMode = useItineraryWorkspaceStore(s => s.transportMode)
  const setTransportMode = useItineraryWorkspaceStore(s => s.setTransportMode)

  const distanceText = leg.distanceKm < 1
    ? `${Math.round(leg.distanceKm * 1000)}米`
    : `${leg.distanceKm.toFixed(1)}公里`

  const getModeIcon = () => {
    switch (leg.mode) {
      case 'walking':
        return <Footprints className="h-3.5 w-3.5 text-emerald-700" />
      case 'transit':
        return <Train className="h-3.5 w-3.5 text-indigo-700" />
      case 'driving':
      default:
        return <Car className="h-3.5 w-3.5 text-amber-700" />
    }
  }

  const amapUrl = generateAmapRouteUrl(
    leg.fromSpotName,
    leg.toSpotName,
    city,
    leg.mode === 'driving' ? 'car' : leg.mode === 'transit' ? 'bus' : 'walk',
  )
  const baiduUrl = generateBaiduRouteUrl(
    leg.fromSpotName,
    leg.toSpotName,
    city,
    leg.mode === 'driving' ? 'driving' : leg.mode === 'transit' ? 'transit' : 'walking',
  )
  const tencentUrl = generateTencentRouteUrl(
    leg.fromSpotName,
    leg.toSpotName,
    city,
    leg.mode === 'driving' ? 'drive' : leg.mode === 'transit' ? 'bus' : 'walk',
  )

  return (
    <div className="relative my-1 pl-8">
      {/* 竖向虚线连接 */}
      <div className="absolute left-3.5 top-0 bottom-0 w-0.5 -translate-x-1/2 border-l border-dashed border-stone-300" />

      <div className="relative flex flex-col py-1">
        <button
          className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-200/90 bg-stone-50/90 px-3 py-1 text-[11px] font-medium text-stone-600 hover:border-emerald-500 hover:bg-emerald-50/70 hover:text-emerald-900 transition-all cursor-pointer shadow-2xs"
          onClick={() => setIsExpanded(prev => !prev)}
          type="button"
        >
          <span className="flex items-center gap-1 font-semibold text-stone-800">
            {getModeIcon()}
            <span>{leg.durationText}</span>
          </span>
          <span className="text-stone-400">·</span>
          <span>{distanceText}</span>
          {isExpanded ? (
            <ChevronUp className="h-3 w-3 text-stone-400" />
          ) : (
            <ChevronDown className="h-3 w-3 text-stone-400" />
          )}
        </button>

        {isExpanded && (
          <div className="mt-2 w-full max-w-sm rounded-xl border border-stone-200 bg-white p-2.5 text-xs shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[11px] text-stone-500 border-b border-stone-100 pb-1.5">
              <span>
                {leg.fromSpotName}
                {' '}
                ➔
                {' '}
                {leg.toSpotName}
              </span>
              <div className="flex gap-1">
                {(['walking', 'transit', 'driving'] as const).map(m => (
                  <button
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      transportMode === m
                        ? 'bg-emerald-700 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                    key={m}
                    onClick={() => setTransportMode(m)}
                    type="button"
                  >
                    {m === 'walking' ? '步行' : m === 'transit' ? '公交' : '驾车'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-bold text-stone-500 flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                <span>精准导航:</span>
              </span>
              <a
                className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                href={amapUrl}
                rel="noreferrer"
                target="_blank"
              >
                高德地图
              </a>
              <a
                className="rounded-lg bg-sky-50 px-2 py-1 text-[11px] font-bold text-sky-800 hover:bg-sky-100 transition-colors"
                href={baiduUrl}
                rel="noreferrer"
                target="_blank"
              >
                百度地图
              </a>
              <a
                className="rounded-lg bg-stone-100 px-2 py-1 text-[11px] font-bold text-stone-700 hover:bg-stone-200 transition-colors"
                href={tencentUrl}
                rel="noreferrer"
                target="_blank"
              >
                腾讯地图
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
