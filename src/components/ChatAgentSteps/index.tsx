import type { AgentStep } from '@/types'
import { CheckCircleOutline, RightOutline } from 'antd-mobile-icons'
/**
 * Chat Agent 思考过程可视化组件
 * 可折叠的动态步骤卡片，展示 AI 调用工具的过程
 */
import { useEffect, useState } from 'react'

interface ChatAgentStepsProps {
  steps: AgentStep[]
  currentStep?: number
  isLoading?: boolean
}

export function ChatAgentSteps({ steps, currentStep, isLoading }: ChatAgentStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  // 加载完成后自动折叠
  useEffect(() => {
    if (!isLoading && steps.length > 0) {
      const timer = setTimeout(setIsExpanded, 800, false)
      return () => clearTimeout(timer)
    }
    if (isLoading) {
      setIsExpanded(true)
    }
  }, [isLoading, steps.length])

  if (steps.length === 0)
    return null

  const stepMap = new Map(steps.map(s => [s.step, s]))
  const completedCount = steps.filter(s => s.status === 'complete').length

  function getStepStatus(stepNum: number): 'pending' | 'running' | 'done' {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete')
      return 'done'
    if (currentStep === stepNum)
      return 'running'
    return 'pending'
  }

  function getSummary(step: AgentStep): string {
    if (!step.data)
      return ''
    const d = step.data as Record<string, unknown>
    if (d.city && d.attractionCount)
      return `${d.city} · ${d.attractionCount} 个景点`
    if (d.cityCount)
      return `${d.cityCount} 个城市`
    if (d.city_a && d.city_b)
      return `${d.city_a} vs ${d.city_b}`
    if (d.city && d.tipCount)
      return `${d.city} · ${d.tipCount} 条贴士`
    return ''
  }

  return (
    <div
      className="mx-4 mb-2 rounded-xl overflow-hidden"
      style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-paper-dark)' }}
    >
      {/* 可点击的标题栏 */}
      <div
        className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{
              background: isLoading
                ? 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)'
                : 'linear-gradient(135deg, var(--c-forest) 0%, var(--c-forest-light) 100%)',
              animation: isLoading ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {isLoading
              ? <div className="w-2 h-2 rounded-full bg-white" />
              : <CheckCircleOutline style={{ fontSize: '12px', color: '#fff' }} />}
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--c-terracotta)' }}>
            Agent 思考过程
          </span>
          <span className="text-xs" style={{ color: 'var(--c-ink-light)' }}>
            (
            {completedCount}
            /
            {steps.length}
            )
          </span>
        </div>
        <span
          className="text-xs transition-transform"
          style={{
            color: 'var(--c-ink-light)',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          ▶
        </span>
      </div>

      {/* 步骤列表 */}
      {isExpanded && (
        <div className="px-4 pb-3">
          {steps.map((step, index) => {
            const status = getStepStatus(step)
            const summary = getSummary(step)
            return (
              <div key={step.step} className="flex items-start gap-2.5">
                {/* 左侧连接线 */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                    style={{
                      background: status === 'done'
                        ? 'linear-gradient(135deg, var(--c-forest) 0%, var(--c-forest-light) 100%)'
                        : status === 'running'
                          ? 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)'
                          : 'var(--c-paper-dark)',
                      color: status === 'pending' ? 'var(--c-ink-light)' : '#fff',
                      animation: status === 'running' ? 'pulseGlow 1.5s ease-in-out infinite' : 'none',
                    }}
                  >
                    {status === 'done'
                      ? <CheckCircleOutline style={{ fontSize: '14px' }} />
                      : <span>{step.step}</span>}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="w-px h-4"
                      style={{ background: status === 'done' ? 'var(--c-forest)' : 'var(--c-paper-dark)' }}
                    />
                  )}
                </div>

                {/* 右侧内容 */}
                <div className="flex-1 pb-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs font-medium"
                      style={{ color: status === 'pending' ? 'var(--c-ink-light)' : 'var(--c-ink)' }}
                    >
                      {step.name}
                    </span>
                    {status === 'running' && (
                      <span className="text-xs" style={{ color: 'var(--c-terracotta)' }}>执行中...</span>
                    )}
                  </div>
                  {summary && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <RightOutline style={{ fontSize: '8px', color: 'var(--c-ink-light)' }} />
                      <span className="text-xs" style={{ color: 'var(--c-ink-light)' }}>{summary}</span>
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
