/**
 * Chat Agent 思考过程可视化组件
 * 可折叠的动态步骤卡片
 */
import { CheckCircleOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import './style.css'

export function ChatAgentSteps({ steps, currentStep, isLoading }) {
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

  if (steps.length === 0) return null

  const stepMap = new Map(steps.map(s => [s.step, s]))
  const completedCount = steps.filter(s => s.status === 'complete').length

  function getStepStatus(stepNum) {
    const step = stepMap.get(stepNum)
    if (step?.status === 'complete') return 'done'
    if (currentStep === stepNum) return 'running'
    return 'pending'
  }

  function getSummary(step) {
    if (!step.data) return ''
    const d = step.data
    if (d.city && d.attractionCount) return `${d.city} · ${d.attractionCount} 个景点`
    if (d.cityCount) return `${d.cityCount} 个城市`
    if (d.city_a && d.city_b) return `${d.city_a} vs ${d.city_b}`
    if (d.city && d.tipCount) return `${d.city} · ${d.tipCount} 条贴士`
    return ''
  }

  return (
    <div className="chat-agent-steps">
      <div className="chat-agent-steps__header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="chat-agent-steps__header-left">
          <div className={`chat-agent-steps__icon ${isLoading ? 'chat-agent-steps__icon--loading' : 'chat-agent-steps__icon--done'}`}>
            {isLoading ? <div className="chat-agent-steps__dot" /> : <CheckCircleOutlined />}
          </div>
          <span className="chat-agent-steps__label">Agent 思考过程</span>
          <span className="chat-agent-steps__count">({completedCount}/{steps.length})</span>
        </div>
        <span className={`chat-agent-steps__arrow ${isExpanded ? 'chat-agent-steps__arrow--expanded' : ''}`}>▶</span>
      </div>

      {isExpanded && (
        <div className="chat-agent-steps__list">
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
