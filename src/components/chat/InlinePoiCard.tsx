'use client'

import { Check, Flame, MapPin } from 'lucide-react'
import Image from 'next/image'
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace'

interface InlinePoiCardProps {
  city?: string
  coverImage?: string
  durationText?: string
  name: string
  rating?: number
  selected?: boolean
}

export function InlinePoiCard({
  city,
  coverImage = '/images/attractions/hangzhou/hangzhou-west-lake.webp',
  durationText,
  name,
  rating = 4.8,
  selected = true,
}: InlinePoiCardProps) {
  const activeSpotId = useItineraryWorkspaceStore(s => s.activeSpotId)
  const setActiveSpotId = useItineraryWorkspaceStore(s => s.setActiveSpotId)
  const days = useItineraryWorkspaceStore(s => s.days)
  const setSelectedDay = useItineraryWorkspaceStore(s => s.setSelectedDay)

  // 查找所属天数和节点
  const handleClick = () => {
    for (const d of days) {
      const found = d.spots.find(sp => sp.name === name)
      if (found) {
        setSelectedDay(d.day)
        setActiveSpotId(found.id)
        break
      }
    }
  }

  return (
    <div
      className={`
        group relative inline-flex items-center gap-2.5 rounded-2xl border p-1.5 pr-3 text-left transition-all duration-200 cursor-pointer shadow-2xs
        ${
          activeSpotId && days.some(d => d.spots.some(sp => sp.id === activeSpotId && sp.name === name))
            ? 'border-emerald-700 bg-emerald-50/80 ring-2 ring-emerald-600/30'
            : 'border-stone-200/90 bg-white hover:border-emerald-500 hover:bg-stone-50'
        }
      `}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      title={`点击在行程看板与地图中定位【${name}】`}
    >
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        <Image
          alt={name}
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          fill
          sizes="48px"
          src={coverImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute bottom-0.5 right-1 flex items-center gap-0.5 text-[9px] font-black text-amber-300 drop-shadow">
          <Flame className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
          <span>{rating}</span>
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold text-stone-900 group-hover:text-emerald-800">
            {name}
          </span>
          {selected && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-stone-600 mt-0.5">
          {city && (
            <span className="flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5 text-stone-500" />
              <span>{city}</span>
            </span>
          )}
          {durationText && <span className="truncate">{durationText}</span>}
        </div>
      </div>
    </div>
  )
}
