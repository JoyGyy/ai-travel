/**
 * 景点项目组件
 *
 * 展示行程中单个景点的详细信息，包括时段标签、
 * 景点名称、描述、游玩时长、门票价格和交通方式。
 * 支持链接到景点详情页。
 */
import type { AttractionRef } from '@/stores/itinerary'
import { CheckCircle2, Clock, Compass, MapPin, Sparkles } from 'lucide-react'
import Link from 'next/link'
import React, { useState } from 'react'

interface SpotData {
  description: string
  duration: string
  spot: string
  ticket?: string
  transportation?: string
}

interface SpotItemProps {
  attractionRef?: AttractionRef
  data: SpotData
  period: '上午' | '下午' | '晚上'
}

export const SpotItem = React.memo(({ attractionRef, data, period }: SpotItemProps) => {
  const [isChecked, setIsChecked] = useState(false)

  // 根据时段（上午/下午/晚上）映射不同手账标签色
  const periodBadgeMap: Record<string, { bg: string, text: string }> = {
    上午: { bg: 'bg-amber-100 text-amber-900 border-amber-300', text: '🌅 上午' },
    下午: { bg: 'bg-emerald-100 text-emerald-900 border-emerald-300', text: '☀️ 下午' },
    晚上: { bg: 'bg-stone-200 text-stone-900 border-stone-300', text: '🌙 晚上' },
  }
  const periodBadge = periodBadgeMap[period] || { bg: 'bg-stone-100 text-stone-800 border-stone-200', text: period }

  return (
    <div
      className={`group/spot relative flex gap-3.5 my-2.5 p-4 rounded-2xl border transition-all duration-300 ${
        isChecked
          ? 'bg-emerald-50/70 border-emerald-300/80 shadow-inner'
          : 'bg-[#FDFBF7] border-stone-200/90 shadow-2xs hover:shadow-md hover:border-emerald-700/50'
      } max-[560px]:flex-col max-[560px]:gap-2`}
    >
      <div className="flex sm:flex-col items-center justify-between gap-2 shrink-0">
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full border text-xs font-bold text-center whitespace-nowrap shadow-2xs ${periodBadge.bg}`}
        >
          {periodBadge.text}
        </span>

        {/* 交互打卡按钮 */}
        <button
          className={`inline-flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-bold transition-all cursor-pointer ${
            isChecked
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-stone-100 text-stone-500 hover:bg-emerald-100 hover:text-emerald-800'
          }`}
          onClick={() => setIsChecked(prev => !prev)}
          title={isChecked ? '取消打卡' : '标记已游玩此景点'}
          type="button"
        >
          {isChecked ? <CheckCircle2 className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          <span>{isChecked ? '已打卡' : '打卡'}</span>
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className={`font-serif text-sm sm:text-base font-bold transition-colors ${
            isChecked ? 'text-emerald-950 line-through decoration-emerald-600/50' : 'text-stone-900 group-hover/spot:text-emerald-800'
          }`}
          >
            {data.spot}
          </h4>
        </div>
        <p className="mb-2 text-xs text-stone-600 leading-relaxed">
          {data.description}
        </p>
        {/* ---- 标签：游玩时长 / 门票 / 交通方式 ---- */}
        <div className="flex gap-2 flex-wrap text-xs">
          {data.duration && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-stone-200 bg-white text-stone-600 font-medium">
              <Clock size={12} className="text-stone-400" />
              {data.duration}
            </span>
          )}
          {data.ticket && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-900 font-bold text-[11px]">
              {data.ticket}
            </span>
          )}
          {data.transportation && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-stone-200 bg-white text-stone-600 font-medium">
              <Compass size={12} className="text-emerald-700" />
              {data.transportation}
            </span>
          )}
        </div>
        {/* ---- 关联景点详情链接 ---- */}
        {attractionRef && (
          <Link
            className="inline-flex items-center gap-1 mt-2 text-emerald-800 text-xs font-bold hover:underline"
            href={`/attractions/${attractionRef.id}`}
          >
            <MapPin size={12} />
            查看「
            {attractionRef.name}
            」景点详情 &rarr;
          </Link>
        )}
      </div>
    </div>
  )
})
