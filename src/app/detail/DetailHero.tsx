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
    <div className="travel-route-line relative isolate min-h-59.5 overflow-hidden rounded-b-[clamp(26px,6vw,44px)] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-[clamp(20px,5vw,44px)] pb-[70px] pt-5.5">
      {/* 背景点阵 */}
      <div className="pointer-events-none absolute inset-0 -z-[1] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px]" />
      {/* 装饰渐变 */}
      <div className="absolute right-[82%] top-[18%] h-[28%] w-[28%] rounded-full bg-travel-orange/26 blur-[100px]" />
      <div className="absolute bottom-[82%] left-[16%] h-[26%] w-[26%] rounded-full bg-cyan-500/18 blur-[100px]" />

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
            className={`flex h-11 items-center justify-center gap-2 rounded-3.5 border px-4 text-sm font-bold transition-all ${
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

      <p className="mt-7 w-fit rounded-full border border-white/15 bg-white/8 px-3 py-1.5 font-sans text-2.5 font-extrabold uppercase tracking-[4px] text-slate-400">
        ITINERARY
      </p>

      <h1
        className="mb-2 mt-2.5 max-w-[min(620px,86vw)] font-display text-[clamp(34px,8vw,58px)] font-black leading-[1.08] text-slate-50"
        id="detail-title"
      >
        {city || '旅行规划'}
      </h1>

      {hasValidParams && (
        <p className="w-fit rounded-full border border-white/12 bg-transparent px-3.5 py-2 text-3.25 font-bold text-white/60">
          {days}
          {' '}
          天行程 · 预算 ¥
          {budget}
        </p>
      )}
    </div>
  )
}
