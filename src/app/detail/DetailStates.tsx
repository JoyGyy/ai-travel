'use client'

/**
 * 行程详情页 — 加载/错误/空状态组件
 */
import type { SSEEvent } from '@/types/api'

import { Compass, MapPin, X } from 'lucide-react'
import dynamic from 'next/dynamic'

const AgentSteps = dynamic(
  () => import('@/components/AgentSteps').then(mod => ({ default: mod.AgentSteps })),
  {
    loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted" />,
  },
)

type StepEvent = Extract<SSEEvent, { type: 'step' }>

/** AI 规划中状态 */
export function LoadingState({
  agentSteps,
  currentAgentStep,
  onClose,
}: {
  agentSteps: StepEvent[]
  currentAgentStep: number
  onClose: () => void
}) {
  return (
    <div
      aria-label="AI 正在规划行程"
      aria-live="polite"
      className="flex justify-center py-7"
      role="status"
    >
      <div className="w-full max-w-[min(100%,520px)] overflow-hidden rounded-3xl border border-travel-ink/8 bg-travel-surface shadow-sm">
        <div className="flex items-center justify-between px-5 pb-2 pt-[18px]">
          <span className="text-2.75 font-extrabold tracking-[2px] text-travel-ink">
            AI 规划中
          </span>
          <button
            aria-label="关闭行程规划并返回"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-900/8 bg-white/72 text-sm text-stone-900/72 transition-all hover:rotate-[8deg] hover:scale-105 hover:bg-accent/20 hover:text-[#d63350]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" />
          </button>
        </div>
        <div className="px-1 pb-3">
          <AgentSteps currentStep={currentAgentStep} steps={agentSteps} />
        </div>
        <div className="relative mx-auto flex h-[46px] w-[46px] items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute inset-0 animate-spin rounded-full border-2 border-dotted border-stone-900/22 border-t-accent"
          />
          <Compass aria-hidden="true" className="text-lg text-travel-ink" />
        </div>
        <p className="py-3 pb-[22px] text-center font-serif text-3.25 text-stone-900/70">
          正在为你规划行程...
        </p>
      </div>
    </div>
  )
}

/** 错误状态 */
export function ErrorState({ message, onGoHome }: { message: string, onGoHome: () => void }) {
  return (
    <div
      className="error-empty-container"
      role="alert"
    >
      <div className="error-empty-icon">
        <MapPin aria-hidden="true" />
      </div>
      <p className="text-center font-serif text-sm leading-relaxed text-stone-900/74">
        {message}
      </p>
      <button
        className="error-empty-btn"
        onClick={onGoHome}
        type="button"
      >
        返回首页重新规划
      </button>
    </div>
  )
}

/** 空状态 */
export function EmptyState({ onGoChat }: { onGoChat: () => void }) {
  return (
    <div
      className="error-empty-container"
      role="status"
    >
      <div className="error-empty-icon">
        <MapPin aria-hidden="true" />
      </div>
      <p className="text-center font-serif text-sm leading-relaxed text-stone-900/74">
        暂无行程数据
      </p>
      <button
        className="error-empty-btn"
        onClick={onGoChat}
        type="button"
      >
        咨询 AI 生成行程
      </button>
    </div>
  )
}
