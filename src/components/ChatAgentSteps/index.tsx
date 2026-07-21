/**
 * Chat Agent 思考过程可视化组件
 * 以可折叠卡片形式展示聊天页中 AI Agent 的推理步骤
 * 加载中自动展开，完成后延迟 800ms 自动收起，也可手动切换
 */
import type { SSEEvent } from '@/types/api'
import { CheckCircleOutlined, RightOutlined } from '@ant-design/icons'

import { useEffect, useState } from 'react'

import './style.css'

/* ========== 类型定义 ========== */

/** 从 SSEEvent 中提取 step 类型事件 */
type StepEvent = Extract<SSEEvent, { type: 'step' }>

interface ChatAgentStepsProps {
  steps: StepEvent[]
  currentStep: number
  isLoading: boolean
}

/* ========== Chat Agent 步骤组件 ========== */

export function ChatAgentSteps({ steps, currentStep, isLoading }: ChatAgentStepsProps) {
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
  if (steps.length === 0)
    return null

  /** 将步骤事件数组转为 Map，便于按步骤号快速查找 */
  const stepMap = new Map(steps.map(s => [s.step, s]))
  /** 已完成步骤数 */
  const completedCount = steps.filter(s => s.status === 'complete').length

  /** 判断指定步骤的当前状态：已完成 / 执行中 / 等待中 */
  function getStepStatus(stepNum: number): 'done' | 'running' | 'pending' {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete')
      return 'done'
    if (currentStep === stepNum)
      return 'running'
    return 'pending'
  }

  /** 根据步骤数据提取人类可读的摘要文本 */
  function getSummary(step: StepEvent): string {
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

  /* ========== 渲染：可折叠步骤卡片 ========== */

  return (
    <div className="chat-agent-steps">
      {/* 可点击的折叠头：显示状态图标、标题和步骤计数 */}
      <button
        type="button"
        className="chat-agent-steps__header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="chat-agent-steps-list"
      >
        <span className="chat-agent-steps__header-left">
          {/* 加载中显示动态圆点，完成后显示勾号 */}
          <span className={`chat-agent-steps__icon ${isLoading ? 'chat-agent-steps__icon--loading' : 'chat-agent-steps__icon--done'}`} aria-hidden="true">
            {isLoading ? <span className="chat-agent-steps__dot" /> : <CheckCircleOutlined />}
          </span>
          <span className="chat-agent-steps__label">Agent 思考过程</span>
          <span className="chat-agent-steps__count">
            (
            {completedCount}
            /
            {steps.length}
            )
          </span>
        </span>
        <span className={`chat-agent-steps__arrow ${isExpanded ? 'chat-agent-steps__arrow--expanded' : ''}`} aria-hidden="true">▶</span>
      </button>

      {/* 展开后的步骤列表 */}
      {isExpanded && (
        <div id="chat-agent-steps-list" className="chat-agent-steps__list" aria-live="polite">
          {steps.map((step, index) => {
            const status = getStepStatus(step.step)
            const summary = getSummary(step)
            return (
              <div key={step.step} className="chat-agent-steps__item">
                {/* 左侧时间线：步骤编号圆点 + 连接线 */}
                <div className="chat-agent-steps__line">
                  <div className={`chat-agent-steps__dot-item chat-agent-steps__dot-item--${status}`}>
                    {status === 'done' ? <CheckCircleOutlined /> : <span>{step.step}</span>}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`chat-agent-steps__conn ${status === 'done' ? 'chat-agent-steps__conn--done' : ''}`} />
                  )}
                </div>
                {/* 右侧步骤信息：名称 + 状态 + 结果摘要 */}
                <div className="chat-agent-steps__body">
                  <div className="chat-agent-steps__name-row">
                    <span className={`chat-agent-steps__name ${status === 'pending' ? 'chat-agent-steps__name--pending' : ''}`}>
                      {step.name}
                    </span>
                    {status === 'running' && <span className="chat-agent-steps__running">执行中...</span>}
                  </div>
                  {summary && (
                    <div className="chat-agent-steps__summary">
                      <RightOutlined className="chat-agent-steps__summary-arrow" />
                      <span>{summary}</span>
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
