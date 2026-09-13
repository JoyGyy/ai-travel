'use client'

import type { WorkspaceSpotNode } from '@/stores/itineraryWorkspace'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Flame,
  Heart,
  MapPin,
  Plus,
  Sparkles,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { generateAmapSpotUrl } from '@/lib/map/amap'
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace'

interface FloatingPoiCardProps {
  city: string
  onClose: () => void
  spot: WorkspaceSpotNode
}

export function FloatingPoiCard({ city, onClose, spot }: FloatingPoiCardProps) {
  const [isFavorited, setIsFavorited] = useState(false)
  const [activeImgIdx, setActiveImgIdx] = useState(0)

  const selectedDay = useItineraryWorkspaceStore(s => s.selectedDay)
  const days = useItineraryWorkspaceStore(s => s.days)
  const addSpotToDay = useItineraryWorkspaceStore(s => s.addSpotToDay)

  // 检查是否已存在于当前天
  const currentDay = days.find(d => d.day === (selectedDay > 0 ? selectedDay : 1))
  const isAddedToCurrentDay = currentDay?.spots.some(sp => sp.name === spot.name)

  const images = [
    spot.coverImage || '/images/attractions/hangzhou/hangzhou-west-lake.webp',
    '/images/attractions/hangzhou/hangzhou-lingyin-temple.webp',
  ]

  const handleAddSpot = () => {
    const targetDay = selectedDay > 0 ? selectedDay : 1
    addSpotToDay(targetDay, {
      coverImage: spot.coverImage,
      name: spot.name,
      openingHours: spot.openingHours,
      priceText: spot.priceText,
      recommendedDuration: spot.recommendedDuration,
      summary: spot.summary,
      ticketType: spot.ticketType,
    })
  }

  const amapUrl = generateAmapSpotUrl(spot.name, city)

  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-84 z-20 overflow-hidden rounded-3xl border border-stone-200/90 bg-white/95 backdrop-blur-md shadow-xl transition-all">
      {/* 顶部图片与轮播指示 */}
      <div className="relative h-36 w-full overflow-hidden bg-stone-100">
        <Image
          alt={spot.name}
          className="object-cover transition-all duration-300"
          fill
          priority
          sizes="340px"
          src={images[activeImgIdx % images.length]}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* 顶部快捷操作 */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors cursor-pointer"
            onClick={onClose}
            title="关闭卡片"
            type="button"
          >
            <X className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-black/40 backdrop-blur-xs transition-colors cursor-pointer ${
                isFavorited ? 'text-rose-500 fill-rose-500' : 'text-white hover:text-rose-300'
              }`}
              onClick={() => setIsFavorited(prev => !prev)}
              title={isFavorited ? '取消收藏' : '加入收藏'}
              type="button"
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorited ? 'fill-rose-500' : ''}`} />
            </button>
            <a
              className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-xs transition-colors"
              href={amapUrl}
              rel="noreferrer"
              target="_blank"
              title="在高德地图中查看"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* 图片翻页指示器 */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 z-10">
            {images.map((_, i) => (
              <button
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  activeImgIdx === i ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                }`}
                key={i}
                onClick={() => setActiveImgIdx(i)}
                type="button"
              />
            ))}
          </div>
        )}
      </div>

      {/* 下方详细信息 */}
      <div className="p-3.5 space-y-2.5">
        <div>
          <div className="flex items-center justify-between">
            <h4 className="font-sans text-base font-bold text-stone-900 flex items-center gap-1.5 truncate">
              <span>{spot.name}</span>
              {spot.rating && (
                <span className="flex items-center gap-0.5 text-xs text-amber-600 font-black">
                  <Flame className="h-3 w-3 fill-amber-500 text-amber-500" />
                  <span>{spot.rating}</span>
                </span>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
            <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md text-[10px]">
              {spot.rating || 4.8}
              分
            </span>
            <span>
              {spot.reviewCount || 520}
              条点评
            </span>
            <span>·</span>
            <span>{spot.ticketType === 'free' ? '免费开放' : spot.priceText || '收费'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-100">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 text-stone-400 shrink-0" />
            <span>{spot.address || `${city}核心风景区`}</span>
          </span>
          <span className="text-emerald-700 font-medium shrink-0">
            {spot.recommendedDuration || '游玩 1-2h'}
          </span>
        </div>

        {/* 核心操作按钮 */}
        <div className="pt-1">
          {isAddedToCurrentDay ? (
            <button
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs cursor-default shadow-2xs"
              type="button"
            >
              <Check className="h-3.5 w-3.5 stroke-[3]" />
              <span>
                已添加至 第
                {currentDay?.day || 1}
                天
              </span>
            </button>
          ) : (
            <button
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              onClick={handleAddSpot}
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>
                添加到 第
                {currentDay?.day || 1}
                天
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
