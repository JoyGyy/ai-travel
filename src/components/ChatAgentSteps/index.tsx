/**
 * Chat Agent 思考过程可视化组件
 * 可折叠的动态步骤卡片
 */
import type { SSEEvent } from '@/types/api'
import { CheckCircleOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import './style.css'

type StepEvent = Extract<SSEEvent, { type: 'step' }>

interface ChatAgentStepsProps {
  steps: StepEvent[]
  currentStep: number
  isLoading: boolean
}

export function ChatAgentSteps({ steps, currentStep, isLoading }: ChatAgentStepsProps) {
  const [isExpanded, setIsExpanded] = useState(true)

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

  if (steps.length === 0)
    return null

  const stepMap = new Map(steps.map(s => [s.step, s]))
  const completedCount = steps.filter(s => s.status === 'complete').length

  function getStepStatus(stepNum: number): 'done' | 'running' | 'pending' {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete')
      return 'done'
    if (currentStep === stepNum)
      return 'running'
    return 'pending'
  }

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

  return (
    <div className="chat-agent-steps">
      <button
        type="button"
        className="chat-agent-steps__header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="chat-agent-steps-list"
      >
        <span className="chat-agent-steps__header-left">
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

      {isExpanded && (
        <div id="chat-agent-steps-list" className="chat-agent-steps__list" aria-live="polite">
          {steps.map((step, index) => {
            const status = getStepStatus(step.step)
            const summary = getSummary(step)
            return (
              <div key={step.step} className="chat-agent-steps__item">
                <div className="chat-agent-steps__line">
                  <div className={`chat-agent-steps__dot-item chat-agent-steps__dot-item--${status}`}>
                    {status === 'done' ? <CheckCircleOutlined /> : <span>{step.step}</span>}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`chat-agent-steps__conn ${status === 'done' ? 'chat-agent-steps__conn--done' : ''}`} />
                  )}
                </div>
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
