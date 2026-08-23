'use client'

/**
 * 行程详情页 — Hero 区域
 * 包含返回按钮、编辑模式控制、标题和行程参数展示
 */
import { ArrowLeft, Edit3, Redo, Undo } from 'lucide-react'

interface DetailHeroProps {
  budget: number
  canRedo: boolean
  canUndo: boolean
  city: string
  days: number
  hasValidParams: boolean
  isEditing: boolean
  onRedo: () => void
  onToggleEdit: () => void
  onUndo: () => void
}

export function DetailHero({
  budget,
  canRedo,
  canUndo,
  city,
  days,
  hasValidParams,
  isEditing,
  onRedo,
  onToggleEdit,
  onUndo,
}: DetailHeroProps) {
  return (
    <div className="travel-route-line relative isolate min-h-59.5 overflow-hidden rounded-b-lg bg-travel-ink p-[clamp(20px,5vw,44px)] pb-[70px] pt-5.5">
      <div className="relative z-[2] flex items-center justify-between">
        <button
          className="hero-btn"
          onClick={() => window.history.back()}
          type="button"
        >
          <ArrowLeft />
        </button>

        {/* 编辑模式按钮 */}
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <button
                className="hero-btn disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!canUndo}
                onClick={onUndo}
                type="button"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                className="hero-btn disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!canRedo}
                onClick={onRedo}
                type="button"
              >
                <Redo className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            className={`flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-all ${
              isEditing
                ? 'border-accent bg-accent/20 text-accent'
                : 'border-white/15 bg-white/10 text-slate-100 hover:-translate-y-0.5 hover:bg-white/20'
            }`}
            onClick={onToggleEdit}
            type="button"
          >
            <Edit3 className="h-4 w-4" />
            {isEditing ? '完成编辑' : '编辑'}
          </button>
        </div>
      </div>

      <p className="mt-7 font-sans text-2.5 font-semibold uppercase tracking-[4px] text-white/55">
        ITINERARY
      </p>

      <h1
        className="mb-2 mt-2.5 max-w-[min(620px,86vw)] font-display text-[clamp(32px,7vw,52px)] font-bold leading-[1.1] text-white"
        id="detail-title"
      >
        {city || '旅行规划'}
      </h1>

      {hasValidParams && (
        <p className="w-fit border-l-2 border-secondary pl-3 text-3.25 font-medium text-white/65">
          {days}
          {' '}
          天行程 · 预算 ¥
          {budget}
        </p>
      )}
    </div>
  )
}
