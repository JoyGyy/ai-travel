/**
 * Agent 执行步骤可视化组件
 * 展示 AI Agent 的多步骤推理过程（行程推荐流程）
 * 包含步骤状态判定、结果摘要提取和步骤时间线渲染
 */
import type { SSEEvent } from '@/types/api'

import {
  CheckCircleOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FlagOutlined,
  InfoCircleOutlined,
  RightOutlined,
  SearchOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'

import './style.css'

/* ========== 类型定义 ========== */

/** 从 SSEEvent 中提取 step 类型事件 */
type StepEvent = Extract<SSEEvent, { type: 'step' }>

interface AgentStepsProps {
  steps: StepEvent[]
  currentStep: number
}

/* ========== 步骤静态配置 ========== */

/** 6 个固定步骤的名称和对应图标 */
const STEP_CONFIG = [
  { step: 1, name: '解析意图', Icon: SearchOutlined },
  { step: 2, name: '知识库检索', Icon: UnorderedListOutlined },
  { step: 3, name: '查询天气', Icon: InfoCircleOutlined },
  { step: 4, name: '行程规划', Icon: EnvironmentOutlined },
  { step: 5, name: '预算计算', Icon: DollarOutlined },
  { step: 6, name: '生成建议', Icon: FlagOutlined },
]

/* ========== Agent 步骤组件 ========== */

export function AgentSteps({ steps, currentStep }: AgentStepsProps) {
  /** 将步骤事件数组转为 Map，便于按步骤号快速查找 */
  const stepMap = new Map(steps.map(s => [s.step, s]))

  /** 判断指定步骤的当前状态：已完成 / 执行中 / 等待中 */
  function getStepStatus(stepNum: number): 'done' | 'running' | 'pending' {
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
      case 1: return `${d.city} · ${d.days}天 · ¥${d.budget}`
      case 2: return `找到 ${d.count} 个景点`
      case 3: return d.temperature ? `${d.temperature}°C · ${d.weatherDesc}` : '天气查询完成'
      case 4: return `${d.days}天行程 · ${d.spotCount} 个景点`
      case 5: return `总预算 ¥${Number(d.accommodation || 0) + Number(d.food || 0) + Number(d.transportation || 0) + Number(d.tickets || 0) + Number(d.other || 0)}`
      case 6: return `${d.count} 条建议`
      default: return ''
    }
  }

  /* ========== 渲染：步骤时间线 ========== */

  return (
    <div className="agent-steps" aria-live="polite">
      {/* 标题栏 */}
      <div className="agent-steps__header">
        <span className="agent-steps__title">AGENT 执行过程</span>
      </div>
      {/* 步骤列表：圆点 + 连接线 + 步骤信息 */}
      <div className="agent-steps__list" role="list">
        {STEP_CONFIG.map((config, index) => {
          const status = getStepStatus(config.step)
          const summary = getResultSummary(config.step)
          return (
            <div key={config.step} className="agent-steps__item" role="listitem" aria-label={`${config.name}：${status === 'done' ? '已完成' : status === 'running' ? '执行中' : '等待中'}`}>
              {/* 左侧时间线：圆点 + 连接线 */}
              <div className="agent-steps__line" aria-hidden="true">
                <div className={`agent-steps__dot agent-steps__dot--${status}`}>
                  {status === 'done'
                    ? <CheckCircleOutlined />
                    : <config.Icon />}
                </div>
                {index < STEP_CONFIG.length - 1 && (
                  <div className={`agent-steps__connector ${status === 'done' ? 'agent-steps__connector--done' : ''}`} />
                )}
              </div>
              <div className="agent-steps__body">
                <div className="agent-steps__name-row">
                  <span className={`agent-steps__name ${status === 'pending' ? 'agent-steps__name--pending' : ''}`}>
                    {config.name}
                  </span>
                  {status === 'running' && <span className="agent-steps__running">执行中...</span>}
                </div>
                {summary && (
                  <div className="agent-steps__summary">
                    <RightOutlined className="agent-steps__arrow" aria-hidden="true" />
                    <span>{summary}</span>
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
