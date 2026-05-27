import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AgentSteps } from '../AgentSteps'

describe('AgentSteps 组件', () => {
  it('应渲染 5 个步骤名称', () => {
    render(<AgentSteps steps={[]} />)
    expect(screen.getByText('解析意图')).toBeInTheDocument()
    expect(screen.getByText('知识库检索')).toBeInTheDocument()
    expect(screen.getByText('行程规划')).toBeInTheDocument()
    expect(screen.getByText('预算计算')).toBeInTheDocument()
    expect(screen.getByText('生成建议')).toBeInTheDocument()
  })

  it('应显示"AGENT 执行过程"标题', () => {
    render(<AgentSteps steps={[]} />)
    expect(screen.getByText('AGENT 执行过程')).toBeInTheDocument()
  })

  it('已完成的步骤应显示结果摘要', () => {
    const steps = [
      { step: 1, name: '解析意图', status: 'complete' as const, data: { city: '杭州', days: 3, budget: 5000 } },
    ]
    render(<AgentSteps steps={steps} />)
    expect(screen.getByText(/杭州.*3天.*5000/)).toBeInTheDocument()
  })

  it('运行中的步骤应显示"执行中..."', () => {
    render(<AgentSteps steps={[]} currentStep={2} />)
    expect(screen.getByText('执行中...')).toBeInTheDocument()
  })
})
