'use client'

import { CheckCircle2, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Chat Agent 思考过程可视化组件
 * 以可折叠卡片形式展示聊天页中 AI Agent 的推理步骤
 * 加载中自动展开，完成后延迟 800ms 自动收起，也可手动切换
 */
import type { SSEEvent } from '@/types/api'

/* ========== 类型定义 ========== */

interface ChatAgentStepsProps {
  currentStep: number
  isLoading: boolean
  steps: StepEvent[]
}

/** 从 SSEEvent 中提取 step 类型事件 */
type StepEvent = Extract<SSEEvent, { type: 'step' }>

/* ========== Chat Agent 步骤组件 ========== */

export function ChatAgentSteps({ currentStep, isLoading, steps }: ChatAgentStepsProps) {
  /** 控制步骤卡片的展开/收起状态 */
  const [isExpanded, setIsExpanded] = useState(true)

  /** 自动展开/收起逻辑：加载中展开，完成后延迟收起 */
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(setIsExpanded, 0, true)
      return () => clearTimeout(timer)
    }
    if (steps.length > 0) {
      const timer = setTimeout(setIsExpanded, 800, false)
      return () => clearTimeout(timer)
    }
  }, [isLoading, steps.length])

  // 无步骤时不渲染
  if (steps.length === 0) return null

  /** 将步骤事件数组转为 Map，便于按步骤号快速查找 */
  const stepMap = new Map(steps.map((s) => [s.step, s]))
  /** 已完成步骤数 */
  const completedCount = steps.filter((s) => s.status === 'complete').length

  /** 判断指定步骤的当前状态：已完成 / 执行中 / 等待中 */
  function getStepStatus(stepNum: number): 'done' | 'pending' | 'running' {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete') return 'done'
    if (currentStep === stepNum) return 'running'
    return 'pending'
  }

  /** 根据步骤数据提取人类可读的摘要文本 */
  function getSummary(step: StepEvent): string {
    if (!step.data) return ''
    const d = step.data as Record<string, unknown>
    if (d.city && d.attractionCount) return `${d.city} · ${d.attractionCount} 个景点`
    if (d.cityCount) return `${d.cityCount} 个城市`
    if (d.city_a && d.city_b) return `${d.city_a} vs ${d.city_b}`
    if (d.city && d.tipCount) return `${d.city} · ${d.tipCount} 条贴士`
    return ''
  }

  /* ========== 渲染：可折叠步骤卡片 ========== */

  return (
    <div className="overflow-hidden mx-1 sm:mx-2 mb-3 border border-[rgba(28,25,23,0.06)] rounded-[18px] bg-[var(--travel-surface)] shadow-[var(--shadow-paper)]">
      {/* 可点击的折叠头：显示状态图标、标题和步骤计数 */}
      <button
        aria-controls="chat-agent-steps-list"
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between gap-3 py-[11px] px-4 border-0 text-inherit bg-transparent cursor-pointer text-left select-none transition-colors duration-200 hover:bg-[rgba(249,224,189,0.3)] focus-visible:outline-[3px] focus-visible:outline-[rgba(41,37,36,0.22)] focus-visible:outline-offset-[-3px] motion-reduce:transition-none"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="flex items-center gap-2 min-w-0">
          {/* 加载中显示动态圆点，完成后显示勾号 */}
          <span
            aria-hidden="true"
            className={`w-[22px] h-[22px] flex shrink-0 items-center justify-center rounded-full text-xs ${
              isLoading
                ? 'bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] animate-[pulseGlow_1.5s_ease-in-out_infinite] motion-reduce:animate-none'
                : 'text-white bg-gradient-to-br from-[var(--travel-ocean)] to-[var(--color-secondary)]'
            }`}
          >
            {isLoading ? (
              <span className="w-2 h-2 block rounded-full bg-white" />
            ) : (
              <CheckCircle2 size={16} />
            )}
          </span>
          <span className="text-[var(--color-primary)] text-xs font-extrabold tracking-[0.08em]">
            Agent 思考过程
          </span>
          <span className="shrink-0 text-[rgba(41,37,36,0.58)] text-xs tabular-nums">
            ({completedCount}/{steps.length})
          </span>
        </span>
        <span
          aria-hidden="true"
          className={`shrink-0 text-[rgba(41,37,36,0.52)] text-xs transition-transform duration-200 motion-reduce:transition-none ${isExpanded ? 'rotate-90' : ''}`}
        >
          ▶
        </span>
      </button>

      {/* 展开后的步骤列表 */}
      {isExpanded && (
        <div aria-live="polite" className="pt-0.5 px-4 pb-3.5" id="chat-agent-steps-list">
          {steps.map((step, index) => {
            const status = getStepStatus(step.step)
            const summary = getSummary(step)
            return (
              <div className="flex items-start gap-[10px]" key={step.step}>
                {/* 左侧时间线：步骤编号圆点 + 连接线 */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-6 h-6 flex shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      status === 'done'
                        ? 'text-white bg-gradient-to-br from-[var(--travel-ocean)] to-[var(--color-secondary)]'
                        : status === 'running'
                          ? 'text-white bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] animate-[pulseGlow_1.5s_ease-in-out_infinite] motion-reduce:animate-none'
                          : 'text-[var(--travel-muted)] bg-[rgba(var(--travel-ocean-rgb),0.1)]'
                    }`}
                  >
                    {status === 'done' ? <CheckCircle2 size={14} /> : <span>{step.step}</span>}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-px h-4 ${status === 'done' ? 'bg-[var(--travel-ocean)]' : 'bg-[rgba(var(--travel-ocean-rgb),0.1)]'}`}
                    />
                  )}
                </div>
                {/* 右侧步骤信息：名称 + 状态 + 结果摘要 */}
                <div className="flex-1 min-w-0 pb-[5px]">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`min-w-0 text-xs font-semibold [overflow-wrap:anywhere] ${
                        status === 'pending'
                          ? 'text-[var(--travel-muted)]'
                          : 'text-[var(--travel-ink)]'
                      }`}
                    >
                      {step.name}
                    </span>
                    {status === 'running' && (
                      <span className="shrink-0 text-[var(--color-primary)] text-xs font-semibold">
                        执行中...
                      </span>
                    )}
                  </div>
                  {summary && (
                    <div className="flex items-center gap-1 mt-0.5 text-[rgba(41,37,36,0.56)]">
                      <ChevronRight className="shrink-0 text-current text-[8px]" size={14} />
                      <span className="min-w-0 text-current text-xs [overflow-wrap:anywhere]">
                        {summary}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
