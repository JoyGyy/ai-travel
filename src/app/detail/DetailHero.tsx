'use client'

/**
 * 行程详情页 — Hero 区域
 * 包含返回按钮、编辑模式控制、标题和行程参数展示
 */
import { ArrowLeft, Edit3, Redo, Undo } from 'lucide-react'
import { StampAnimation } from '@/components/detail/StampAnimation'

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
    <div className="travel-route-line relative isolate min-h-59.5 overflow-hidden rounded-b-3xl bg-emerald-950 p-[clamp(20px,5vw,44px)] pb-[70px] pt-6 border-b border-emerald-800/50 shadow-lg text-white">
      <div className="relative z-[2] flex items-center justify-between">
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-all cursor-pointer shadow-sm"
          onClick={() => window.history.back()}
          type="button"
        >
          <ArrowLeft size={18} />
        </button>

        {/* 编辑模式按钮 */}
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!canUndo}
                onClick={onUndo}
                type="button"
              >
                <Undo className="h-4 w-4" />
              </button>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!canRedo}
                onClick={onRedo}
                type="button"
              >
                <Redo className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-bold transition-all cursor-pointer ${
              isEditing
                ? 'border-amber-400 bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20'
                : 'border-white/20 bg-white/10 text-stone-100 hover:bg-white/20'
            }`}
            onClick={onToggleEdit}
            type="button"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {isEditing ? '完成编辑' : '微调行程'}
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-serif italic text-amber-300 text-xs tracking-widest">
              TRAVEL JOURNAL & ROADBOOK
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-800/80 text-[10px] font-bold text-emerald-200 border border-emerald-600/40">
              AI 专属定制
            </span>
          </div>

          <h1
            className="mb-2 mt-2 max-w-[min(620px,86vw)] font-serif text-3xl sm:text-4xl md:text-5xl font-black leading-tight text-white drop-shadow-sm"
            id="detail-title"
          >
            {city ? `${city} · 深度漫游手账` : '旅行手账规划'}
          </h1>

          {hasValidParams && (
            <p className="w-fit border-l-2 border-amber-400 pl-3 text-xs sm:text-sm font-medium text-stone-200 mt-1">
              {days}
              {' '}
              天行程规划 · 预估总预算 ¥
              {budget}
            </p>
          )}
        </div>

        {/* 旅行印章动效 */}
        {city && (
          <div className="self-end sm:self-auto shrink-0 mb-1">
            <StampAnimation city={city} />
          </div>
        )}
      </div>
    </div>
  )
}
