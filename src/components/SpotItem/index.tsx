/**
 * 景点项目组件
 *
 * 展示行程中单个景点的详细信息，包括时段标签、
 * 景点名称、描述、游玩时长、门票价格和交通方式。
 * 支持链接到景点详情页。
 */
import type { AttractionRef } from '@/stores/itinerary'
import { Clock, Compass } from 'lucide-react'
import Link from 'next/link'

import React from 'react'

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
  // 根据时段（上午/下午/晚上）映射不同的主题色和背景色
  const periodColorMap: Record<string, string> = {
    上午: 'var(--travel-period-morning)',
    下午: 'var(--travel-period-afternoon)',
    晚上: 'var(--travel-period-evening)',
  }
  const periodBgMap: Record<string, string> = {
    上午: 'rgba(var(--travel-sand-rgb), 0.2)',
    下午: 'rgba(var(--travel-accent-rgb), 0.18)',
    晚上: 'rgba(var(--travel-ocean-rgb), 0.12)',
  }
  const periodColor = periodColorMap[period] || 'var(--travel-accent)'
  const periodBg = periodBgMap[period] || 'rgba(var(--travel-accent-rgb), 0.16)'

  return (
    <div
      className="relative flex gap-[14px] my-[10px] p-[14px] border border-[rgba(28,25,23,0.05)] border-l-4 border-l-[var(--travel-accent)] rounded-[18px] bg-travel-surface shadow-[0_10px_26px_rgba(var(--travel-ocean-rgb),0.06)] last:mb-0 max-[560px]:flex-col max-[560px]:gap-[10px]"
      style={{ borderLeftColor: periodColor }}
    >
      <div
        className="shrink-0 self-start min-w-12 px-2.5 py-1.5 rounded-full border border-[rgba(28,25,23,0.06)] font-[var(--font-display)] text-xs font-black text-center whitespace-nowrap shadow-[inset_0_0_0_1px_rgba(var(--travel-white-rgb),0.24)] max-[560px]:w-fit"
        style={{ background: periodBg, color: periodColor }}
      >
        {period}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="mb-1.5 [overflow-wrap:anywhere] font-[var(--font-display)] text-[15px] leading-[1.35] font-extrabold text-[var(--travel-ocean)]">
          {data.spot}
        </h4>
        <p className="mb-2.5 [overflow-wrap:anywhere] text-xs text-[rgba(var(--travel-ink-rgb),0.7)] leading-[1.7]">
          {data.description}
        </p>
        {/* ---- 标签：游玩时长 / 门票 / 交通方式 ---- */}
        <div className="flex gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1 min-w-0 max-w-full px-[9px] py-1 rounded-full border border-[rgba(28,25,23,0.06)] bg-[rgba(28,25,23,0.03)] text-[rgba(var(--travel-ink-rgb),0.66)] text-xs font-bold [&>svg]:shrink-0 [&>svg]:text-[rgba(var(--travel-ocean-rgb),0.64)]">
            <Clock size={14} />
            {' '}
            {data.duration}
          </span>
          <span className="inline-flex items-center gap-1 min-w-0 max-w-full px-[9px] py-1 rounded-full border border-[rgba(28,25,23,0.06)] bg-[rgba(var(--travel-primary-rgb),0.12)] text-[var(--color-primary-strong)] text-xs font-black [&>svg]:shrink-0 [&>svg]:text-[rgba(var(--travel-ocean-rgb),0.64)]">
            {data.ticket}
          </span>
          <span className="inline-flex items-center gap-1 min-w-0 max-w-full px-[9px] py-1 rounded-full border border-[rgba(28,25,23,0.06)] bg-[rgba(28,25,23,0.03)] text-[rgba(var(--travel-ink-rgb),0.66)] text-xs font-bold [&>svg]:shrink-0 [&>svg]:text-[rgba(var(--travel-ocean-rgb),0.64)]">
            <Compass size={14} />
            {' '}
            {data.transportation}
          </span>
        </div>
        {/* ---- 关联景点详情链接（有 attractionRef 时显示） ---- */}
        {attractionRef
          ? (
              <Link
                className="inline-flex mt-2.5 text-[var(--travel-primary)] text-xs font-black hover:opacity-80"
                href={`/attractions/${attractionRef.id}`}
              >
                {`查看${attractionRef.name}详情`}
              </Link>
            )
          : null}
      </div>
    </div>
  )
})
