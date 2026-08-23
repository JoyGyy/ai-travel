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
const ToolSteps = dynamic(
  () => import('@/components/ToolSteps').then(mod => ({ default: mod.ToolSteps })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted" />,
  },
)

type StepEvent = Extract<SSEEvent, { type: 'step' }>

interface ToolCall {
  args?: Record<string, unknown>
  id: string
  result?: unknown
  state: 'call' | 'result'
  toolName: string
}

/** AI 规划中状态 */
export function LoadingState({
  agentSteps,
  currentAgentStep,
  onClose,
  toolCalls,
}: {
  agentSteps: StepEvent[]
  currentAgentStep: number
  onClose: () => void
  toolCalls?: ToolCall[]
}) {
  return (
    <div
      className="flex justify-center py-7"
    >
      <div className="w-full max-w-[min(100%,580px)] overflow-hidden rounded-lg border border-travel-ink/8 bg-travel-surface shadow-sm">
        <div className="flex items-center justify-between px-5 pb-2 pt-[18px]">
          <span className="text-2.75 font-extrabold tracking-[2px] text-travel-ink">
            AI 规划中
          </span>
          <button
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-900/8 bg-white/72 text-sm text-stone-900/72 transition-all hover:bg-destructive/10 hover:text-destructive"
            onClick={onClose}
            type="button"
          >
            <X />
          </button>
        </div>
        <div className="px-4 pb-3 space-y-3">
          {/* Agent 步骤（SSE 驱动） */}
          {agentSteps.length > 0 && (
            <AgentSteps currentStep={currentAgentStep} steps={agentSteps} />
          )}
          {/* 工具调用步骤（useChat 驱动） */}
          {toolCalls && toolCalls.length > 0 && (
            <ToolSteps isLoading toolCalls={toolCalls} />
          )}
        </div>
        <div className="relative mx-auto flex h-[46px] w-[46px] items-center justify-center">
          <div
            className="absolute inset-0 animate-spin rounded-full border-2 border-dotted border-stone-900/22 border-t-accent"
          />
          <Compass className="text-lg text-travel-ink" />
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
    >
      <div className="error-empty-icon">
        <MapPin />
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
    >
      <div className="error-empty-icon">
        <MapPin />
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
