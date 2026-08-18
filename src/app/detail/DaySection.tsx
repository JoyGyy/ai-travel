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
    <div className="border-b border-stone-900/8 last:border-b-0">
      <button
        aria-controls={panelId}
        aria-expanded={isOpen}
        className="flex min-h-[56px] w-full items-center justify-between gap-4 bg-transparent p-[16px_20px] text-left text-[15px] font-extrabold text-travel-ink transition-colors hover:bg-stone-900/[0.03]"
        onClick={onToggle}
        type="button"
      >
        <span>{item.date}</span>
        <span
          aria-hidden="true"
          className={`inline-flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-stone-900/8 text-[10px] text-travel-ink transition-all ${
            isOpen ? 'rotate-180 bg-accent/22' : ''
          }`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div className="bg-stone-900/[0.015] p-[6px_14px_16px]" id={panelId}>
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
                        aria-label={`上移${spot.name}`}
                        className="spot-edit-btn disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={spotIndex === 0}
                        onClick={() => onMoveSpot(dayIndex, spotIndex, -1)}
                        type="button"
                      >
                        <ArrowUp aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`下移${spot.name}`}
                        className="spot-edit-btn disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={spotIndex === item.spots.length - 1}
                        onClick={() => onMoveSpot(dayIndex, spotIndex, 1)}
                        type="button"
                      >
                        <ArrowDown aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <button
                        aria-label={`删除${spot.name}`}
                        className="spot-edit-btn bg-red-500 text-white hover:bg-red-600"
                        onClick={() => onRemoveSpot(dayIndex, spotIndex)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="h-4 w-4" />
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
                  label="删除上午景点"
                  onRemove={() => onRemoveSpot(dayIndex, 0)}
                  period="上午"
                />
              )}
              {item.afternoon && (
                <SpotWithDelete
                  attractionRef={findAttractionRef(item.afternoon.spot)}
                  data={item.afternoon}
                  isEditing={isEditing}
                  label="删除下午景点"
                  onRemove={() => onRemoveSpot(dayIndex, 1)}
                  period="下午"
                />
              )}
              {item.evening && (
                <SpotWithDelete
                  attractionRef={findAttractionRef(item.evening.spot)}
                  data={item.evening}
                  isEditing={isEditing}
                  label="删除晚上景点"
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
function SpotWithDelete({ attractionRef, data, isEditing, label, onRemove, period }: {
  attractionRef?: AttractionRef
  data: { description: string, duration: string, spot: string, ticket?: string, transportation?: string }
  isEditing: boolean
  label: string
  onRemove: () => void
  period: '上午' | '下午' | '晚上'
}) {
  return (
    <div className="relative group">
      <SpotItem attractionRef={attractionRef} data={data} period={period} />
      {isEditing && (
        <button
          aria-label={label}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
