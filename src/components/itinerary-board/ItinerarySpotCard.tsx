'use client'

import type { WorkspaceSpotNode } from '@/stores/itineraryWorkspace'
import {
  ArrowDown,
  ArrowUp,
  Clock,
  ExternalLink,
  Flame,
  Inbox,
  MoreHorizontal,
  Ticket,
  Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { generateAmapSpotUrl } from '@/lib/map/amap'
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace'

interface ItinerarySpotCardProps {
  canMoveDown: boolean
  canMoveUp: boolean
  city: string
  dayNum: number
  index: number
  isTotalLast: boolean
  spot: WorkspaceSpotNode
}

export function ItinerarySpotCard({
  canMoveDown,
  canMoveUp,
  city,
  dayNum,
  index,
  spot,
}: ItinerarySpotCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const activeSpotId = useItineraryWorkspaceStore(s => s.activeSpotId)
  const setActiveSpotId = useItineraryWorkspaceStore(s => s.setActiveSpotId)
  const moveSpotInDay = useItineraryWorkspaceStore(s => s.moveSpotInDay)
  const removeSpotFromDay = useItineraryWorkspaceStore(s => s.removeSpotFromDay)
  const moveToUnassigned = useItineraryWorkspaceStore(s => s.moveToUnassigned)

  const isActive = activeSpotId === spot.id

  const handleCardClick = () => {
    setActiveSpotId(spot.id)
  }

  const amapSpotUrl = generateAmapSpotUrl(spot.name, city)

  return (
    <div className="relative pl-8">
      {/* 竖向轴点标记 */}
      <div
        className={`
          absolute left-3.5 top-5 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-black shadow-md border-2 border-white transition-transform
          ${isActive ? 'bg-emerald-700 text-white scale-110 ring-4 ring-emerald-200/80 z-10' : 'bg-stone-800 text-white'}
        `}
      >
        {index + 1}
      </div>

      {/* 卡片主体 */}
      <div
        className={`
          group relative flex items-start gap-3.5 rounded-2xl border p-3 transition-all duration-200 cursor-pointer shadow-2xs
          ${
            isActive
              ? 'border-emerald-600 bg-emerald-50/40 ring-2 ring-emerald-600/30'
              : 'border-stone-200/90 bg-white hover:border-emerald-400 hover:shadow-xs'
          }
        `}
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
      >
        {/* 景点封面缩略图 */}
        <div className="relative h-18 w-22 shrink-0 overflow-hidden rounded-xl bg-stone-100 shadow-2xs">
          <Image
            alt={spot.name}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="88px"
            src={spot.coverImage || '/images/attractions/hangzhou/hangzhou-west-lake.webp'}
          />
          {spot.rating && (
            <div className="absolute bottom-1 right-1 flex items-center gap-0.5 rounded-md bg-black/60 px-1 py-0.5 text-[9px] font-bold text-amber-300 backdrop-blur-xs">
              <Flame className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span>{spot.rating}</span>
            </div>
          )}
        </div>

        {/* 景点信息 */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="truncate font-sans text-sm font-bold text-stone-900 group-hover:text-emerald-800">
              {index + 1}
              .
              {spot.name}
            </h4>

            {/* 更多操作菜单 */}
            <div className="relative">
              <button
                aria-label="更多操作"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowMenu(prev => !prev)
                }}
                type="button"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowMenu(false)
                    }}
                  />
                  <div className="absolute right-0 top-7 z-30 w-36 rounded-xl border border-stone-200 bg-white py-1 shadow-lg text-xs">
                    {canMoveUp && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          moveSpotInDay(dayNum, index, index - 1)
                        }}
                        type="button"
                      >
                        <ArrowUp className="h-3.5 w-3.5 text-stone-500" />
                        <span>上移节点</span>
                      </button>
                    )}
                    {canMoveDown && (
                      <button
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(false)
                          moveSpotInDay(dayNum, index, index + 1)
                        }}
                        type="button"
                      >
                        <ArrowDown className="h-3.5 w-3.5 text-stone-500" />
                        <span>下移节点</span>
                      </button>
                    )}
                    <button
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        moveToUnassigned(dayNum, index)
                      }}
                      type="button"
                    >
                      <Inbox className="h-3.5 w-3.5 text-stone-500" />
                      <span>移至待安排</span>
                    </button>
                    <a
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-stone-700 hover:bg-stone-50"
                      href={amapSpotUrl}
                      onClick={e => e.stopPropagation()}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
                      <span>高德地图查看</span>
                    </a>
                    <div className="my-1 border-t border-stone-100" />
                    <button
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-rose-600 hover:bg-rose-50 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowMenu(false)
                        removeSpotFromDay(dayNum, index)
                      }}
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>删除此景点</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 属性标签行 (时长 | 营业 | 门票) */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-stone-500">
            <span className="flex items-center gap-1 text-stone-600">
              <Clock className="h-3 w-3 text-stone-400" />
              <span>{spot.recommendedDuration || '建议玩1-2小时'}</span>
            </span>
            <span className="text-stone-300">|</span>
            <span className="truncate max-w-[120px]">{spot.openingHours || '全天开放'}</span>
            <span className="text-stone-300">|</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-700">
              <Ticket className="h-3 w-3" />
              <span>{spot.ticketType === 'free' ? '免费' : spot.priceText || '收费'}</span>
            </span>
          </div>

          {/* 简介或特色亮点 */}
          {spot.summary && (
            <p className="line-clamp-1 text-[11px] text-stone-500 pt-0.5">
              {spot.summary}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
