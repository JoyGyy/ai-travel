/**
 * Agent 执行步骤可视化组件
 * 展示 AI Agent 的多步骤推理过程，包括解析意图、检索知识库、规划行程等
 */
import type { AgentStep } from '@/types'
import { CheckCircleOutline, InformationCircleOutline, LocationOutline, PayCircleOutline, RightOutline, SearchOutline, UnorderedListOutline, FlagOutline } from 'antd-mobile-icons'

/** 步骤配置 */
const STEP_CONFIG = [
  { step: 1, name: '解析意图', Icon: SearchOutline },
  { step: 2, name: '知识库检索', Icon: UnorderedListOutline },
  { step: 3, name: '查询天气', Icon: InformationCircleOutline },
  { step: 4, name: '行程规划', Icon: LocationOutline },
  { step: 5, name: '预算计算', Icon: PayCircleOutline },
  { step: 6, name: '生成建议', Icon: FlagOutline },
]

interface AgentStepsProps {
  steps: AgentStep[] // 已完成的步骤列表
  currentStep?: number // 当前正在执行的步骤编号
}

export function AgentSteps({ steps, currentStep }: AgentStepsProps) {
  // 将步骤列表转为 Map，方便查找
  const stepMap = new Map(steps.map(s => [s.step, s]))

  /** 获取步骤状态 */
  function getStepStatus(stepNum: number): 'pending' | 'running' | 'done' {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete') return 'done'
    if (currentStep === stepNum) return 'running'
    return 'pending'
  }

  /** 获取步骤的简要结果描述 */
  function getResultSummary(stepNum: number): string {
    const step = stepMap.get(stepNum)
    if (!step?.data) return ''
    const d = step.data as Record<string, unknown>
    switch (stepNum) {
      case 1: return `${d.city} · ${d.days}天 · ¥${d.budget}`
      case 2: return `找到 ${d.count} 个景点`
      case 3: return `${d.days}天 · ${d.spotCount} 个景点`
      case 4: return `总预算 ¥${Number(d.accommodation || 0) + Number(d.food || 0) + Number(d.transportation || 0) + Number(d.tickets || 0) + Number(d.other || 0)}`
      case 5: return `${d.count} 条建议`
      default: return ''
    }
  }

  return (
    <div
      className="mx-4 mb-4 rounded-2xl overflow-hidden"
      style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}
    >
      <div className="px-5 pt-4 pb-2">
        <span className="text-xs font-semibold tracking-wider" style={{ color: 'var(--c-terracotta)' }}>
          AGENT 执行过程
        </span>
      </div>
      <div className="px-5 pb-4">
        {STEP_CONFIG.map((config, index) => {
          const status = getStepStatus(config.step)
          const summary = getResultSummary(config.step)
          return (
            <div key={config.step} className="flex items-start gap-3">
              {/* 左侧连接线 */}
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
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
                    ? <CheckCircleOutline style={{ fontSize: '16px' }} />
                    : <config.Icon style={{ fontSize: '16px' }} />}
                </div>
                {index < STEP_CONFIG.length - 1 && (
                  <div
                    className="w-px h-5"
                    style={{
                      background: status === 'done' ? 'var(--c-forest)' : 'var(--c-paper-dark)',
                    }}
                  />
                )}
              </div>

              {/* 右侧内容 */}
              <div className="flex-1 pb-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: status === 'pending' ? 'var(--c-ink-light)' : 'var(--c-ink)',
                    }}
                  >
                    {config.name}
                  </span>
                  {status === 'running' && (
                    <span className="text-xs" style={{ color: 'var(--c-terracotta)' }}>
                      执行中...
                    </span>
                  )}
                </div>
                {summary && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <RightOutline style={{ fontSize: '10px', color: 'var(--c-ink-light)' }} />
                    <span className="text-xs" style={{ color: 'var(--c-ink-light)' }}>
                      {summary}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}
