/**
 * Agent 执行步骤可视化组件
 * 展示 AI Agent 的多步骤推理过程（行程推荐流程）
 * 包含步骤状态判定、结果摘要提取和步骤时间线渲染
 */
import type { SSEEvent } from '@/types/api'

import {
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Flag,
  Info,
  List,
  MapPin,
  Search,
} from 'lucide-react'

/* ========== 类型定义 ========== */

interface AgentStepsProps {
  currentStep: number
  steps: StepEvent[]
}

/** 从 SSEEvent 中提取 step 类型事件 */
type StepEvent = Extract<SSEEvent, { type: 'step' }>

/* ========== 步骤静态配置 ========== */

/** 6 个固定步骤的名称和对应图标 */
const STEP_CONFIG = [
  { Icon: Search, name: '解析意图', step: 1 },
  { Icon: List, name: '知识库检索', step: 2 },
  { Icon: Info, name: '查询天气', step: 3 },
  { Icon: MapPin, name: '行程规划', step: 4 },
  { Icon: CircleDollarSign, name: '预算计算', step: 5 },
  { Icon: Flag, name: '生成建议', step: 6 },
]

/* ========== Agent 步骤组件 ========== */

export function AgentSteps({ currentStep, steps }: AgentStepsProps) {
  /** 将步骤事件数组转为 Map，便于按步骤号快速查找 */
  const stepMap = new Map(steps.map(s => [s.step, s]))

  /** 判断指定步骤的当前状态：已完成 / 执行中 / 等待中 */
  function getStepStatus(stepNum: number): 'done' | 'pending' | 'running' {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete')
      return 'done'
    if (currentStep === stepNum)
      return 'running'
    return 'pending'
  }

  /** 根据步骤号从 step.data 中提取人类可读的结果摘要 */
  function getResultSummary(stepNum: number): string {
    const step = stepMap.get(stepNum)
    if (!step?.data)
      return ''
    const d = step.data as Record<string, unknown>
    switch (stepNum) {
      case 1:
        return `${d.city} · ${d.days}天 · ¥${d.budget}`
      case 2:
        return `找到 ${d.count} 个景点`
      case 3:
        return d.temperature ? `${d.temperature}°C · ${d.weatherDesc}` : '天气查询完成'
      case 4:
        return `${d.days}天行程 · ${d.spotCount} 个景点`
      case 5:
        return `总预算 ¥${Number(d.accommodation || 0) + Number(d.food || 0) + Number(d.transportation || 0) + Number(d.tickets || 0) + Number(d.other || 0)}`
      case 6:
        return `${d.count} 条建议`
      default:
        return ''
    }
  }

  /* ========== 渲染：步骤时间线 ========== */

  return (
    <div
      aria-live="polite"
      className="mx-4 mb-4 overflow-hidden rounded-[20px] bg-travel-surface border border-travel-ink/6 shadow-sm"
    >
      {/* 标题栏 */}
      <div className="px-5 pt-4 pb-2">
        <span className="text-xs font-black tracking-[2px] text-travel-ocean">
          AGENT 执行过程
        </span>
      </div>
      {/* 步骤列表：圆点 + 连接线 + 步骤信息 */}
      <div className="px-5 pb-4" role="list">
        {STEP_CONFIG.map((config, index) => {
          const status = getStepStatus(config.step)
          const summary = getResultSummary(config.step)
          return (
            <div
              aria-label={`${config.name}：${status === 'done' ? '已完成' : status === 'running' ? '执行中' : '等待中'}`}
              className="flex items-start gap-3"
              key={config.step}
              role="listitem"
            >
              {/* 左侧时间线：圆点 + 连接线 */}
              <div aria-hidden="true" className="flex flex-col items-center">
                <div
                  className={`w-[34px] h-[34px] rounded-full flex items-center justify-center shrink-0 text-sm border border-white/78 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28),_0_10px_22px_rgba(41,37,36,0.08)] ${
                    status === 'done'
                      ? 'bg-gradient-to-br from-travel-ocean to-travel-ocean-light text-white'
                      : status === 'running'
                        ? 'bg-gradient-to-br from-primary to-secondary text-white animate-[pulseGlow_1.5s_ease-in-out_infinite] motion-reduce:animate-none'
                        : 'bg-white/62 text-travel-ocean/42'
                  }`}
                >
                  {status === 'done' ? <CheckCircle2 size={16} /> : <config.Icon />}
                </div>
                {index < STEP_CONFIG.length - 1 && (
                  <div
                    className={`w-px h-[22px] ${
                      status === 'done'
                        ? 'bg-gradient-to-b from-travel-ocean to-travel-ocean/16'
                        : 'bg-travel-ocean/12'
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-[10px]">
                <div className="flex items-center gap-2 min-h-8.5">
                  <span
                    className={`text-sm font-extrabold ${
                      status === 'pending'
                        ? 'text-travel-ink/50'
                        : 'text-travel-ocean'
                    }`}
                  >
                    {config.name}
                  </span>
                  {status === 'running' && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/12 text-[11px] font-extrabold text-primary-strong">
                      执行中...
                    </span>
                  )}
                </div>
                {summary && (
                  <div className="flex items-center gap-[5px] mt-px">
                    <ChevronRight
                      aria-hidden="true"
                      className="shrink-0 text-[10px] text-travel-ocean/48"
                      size={14}
                    />
                    <span className="min-w-0 [overflow-wrap:anywhere] text-xs text-travel-ink/66">
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
