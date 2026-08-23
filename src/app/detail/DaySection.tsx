'use client'

/**
 * 行程详情页 — 每日行程区块
 * 包含日期折叠面板和景点列表（含编辑模式操作按钮）
 */
import type { AttractionRef, ItineraryDay } from '@/stores/itinerary'

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import dynamic from 'next/dynamic'

const SpotItem = dynamic(
  () => import('@/components/SpotItem').then(mod => ({ default: mod.SpotItem })),
  {
    loading: () => <div className="h-24 animate-pulse rounded-xl bg-muted" />,
  },
)

const PERIOD_LABELS = ['上午', '下午', '晚上'] as const

interface DaySectionProps {
  attractionRefs: AttractionRef[]
  dayIndex: number
  isEditing: boolean
  isOpen: boolean
  item: ItineraryDay
  onMoveSpot: (dayIndex: number, spotIndex: number, direction: -1 | 1) => void
  onRemoveSpot: (dayIndex: number, spotIndex: number) => void
  onToggle: () => void
}

export function DaySection({
  attractionRefs,
  dayIndex,
  isEditing,
  isOpen,
  item,
  onMoveSpot,
  onRemoveSpot,
  onToggle,
}: DaySectionProps) {
  const dayKey = String(item.day)
  const panelId = `detail-day-panel-${dayKey}`

  function findAttractionRef(spot?: string) {
    return attractionRefs.find(ref => ref.name === spot)
  }

  return (
    <div className="border-b border-stone-200/80 last:border-b-0">
      <button
        className="flex min-h-14 w-full items-center justify-between gap-4 bg-transparent py-4 px-5 text-left font-serif text-base font-bold text-stone-900 transition-colors hover:bg-stone-200/40 cursor-pointer"
        onClick={onToggle}
        type="button"
      >
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
          <span>{item.date}</span>
        </span>
        <span
          className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-stone-200/70 text-xs text-stone-700 transition-all ${
            isOpen ? 'rotate-180 bg-emerald-100 text-emerald-900 font-bold' : ''
          }`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="bg-[#FAF7F0]/40 p-4 space-y-2" id={panelId}>
          {item.spots && item.spots.length > 0 ? (
            item.spots.map((spot, spotIndex) => {
              const periodLabel = PERIOD_LABELS[spotIndex % PERIOD_LABELS.length]
              return (
                // eslint-disable-next-line react/no-array-index-key
                <div className="group relative" key={`${spot.name}-${spotIndex}`}>
                  <SpotItem
                    attractionRef={findAttractionRef(spot.name)}
                    data={{
                      description: spot.description,
                      duration: spot.duration,
                      spot: spot.name,
                    }}
                    period={periodLabel}
                  />
                  {isEditing && (
                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        className="spot-edit-btn disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={spotIndex === 0}
                        onClick={() => onMoveSpot(dayIndex, spotIndex, -1)}
                        type="button"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        className="spot-edit-btn disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={spotIndex === item.spots.length - 1}
                        onClick={() => onMoveSpot(dayIndex, spotIndex, 1)}
                        type="button"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        className="spot-edit-btn bg-red-500 text-white hover:bg-red-600"
                        onClick={() => onRemoveSpot(dayIndex, spotIndex)}
                        type="button"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <>
              {item.morning && (
                <SpotWithDelete
                  attractionRef={findAttractionRef(item.morning.spot)}
                  data={item.morning}
                  isEditing={isEditing}
                  onRemove={() => onRemoveSpot(dayIndex, 0)}
                  period="上午"
                />
              )}
              {item.afternoon && (
                <SpotWithDelete
                  attractionRef={findAttractionRef(item.afternoon.spot)}
                  data={item.afternoon}
                  isEditing={isEditing}
                  onRemove={() => onRemoveSpot(dayIndex, 1)}
                  period="下午"
                />
              )}
              {item.evening && (
                <SpotWithDelete
                  attractionRef={findAttractionRef(item.evening.spot)}
                  data={item.evening}
                  isEditing={isEditing}
                  onRemove={() => onRemoveSpot(dayIndex, 2)}
                  period="晚上"
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

/** 带删除按钮的景点项（非编辑模式下的 morning/afternoon/evening） */
function SpotWithDelete({ attractionRef, data, isEditing, onRemove, period }: {
  attractionRef?: AttractionRef
  data: { description: string, duration: string, spot: string, ticket?: string, transportation?: string }
  isEditing: boolean
  onRemove: () => void
  period: '上午' | '下午' | '晚上'
}) {
  return (
    <div className="relative group">
      <SpotItem attractionRef={attractionRef} data={data} period={period} />
      {isEditing && (
        <button
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
          onClick={onRemove}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
