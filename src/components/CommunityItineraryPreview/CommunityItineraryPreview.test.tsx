import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { CommunityItineraryPreview } from './index'

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode, href: string }) => (
    <a href={href}>{children}</a>
  ),
}))

describe('communityItineraryPreview', () => {
  it('当 snapshot 为 null 时不渲染任何内容', () => {
    const { container } = render(<CommunityItineraryPreview snapshot={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('当 snapshot 为空字符串或无效 JSON 时不崩溃且不渲染', () => {
    const { container } = render(<CommunityItineraryPreview snapshot="invalid json string" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('当 snapshot 为 JSON 字符串时能正确解析并渲染', () => {
    const jsonStr = JSON.stringify({
      budget: 1500,
      city: '成都',
      days: 2,
      itinerary: [
        {
          day: 1,
          spots: [{ description: '著名景点', duration: '2小时', name: '宽窄巷子' }],
          title: '成都经典打卡',
        },
      ],
    })

    render(<CommunityItineraryPreview snapshot={jsonStr} />)
    expect(screen.getByText('成都')).toBeInTheDocument()
    expect(screen.getByText('宽窄巷子')).toBeInTheDocument()
    expect(screen.getByText('2天')).toBeInTheDocument()
  })

  it('在 detail 模式下完整渲染景点和预算信息', () => {
    const snapshot = {
      budget: 2000,
      budgetBreakdown: {
        accommodation: 800,
        attractions: 300,
        food: 500,
        total: 2000,
        transport: 400,
      },
      city: '杭州',
      days: 1,
      itinerary: [
        {
          day: 1,
          spots: [{ description: '西湖美景', duration: '3小时', name: '西湖' }],
          title: '西湖漫步',
        },
      ],
      tips: ['带好遮阳伞'],
    }

    render(<CommunityItineraryPreview mode="detail" snapshot={snapshot} />)
    expect(screen.getByText('杭州')).toBeInTheDocument()
    expect(screen.getByText('西湖')).toBeInTheDocument()
    expect(screen.getByText('带好遮阳伞')).toBeInTheDocument()
    expect(screen.getByText('查看预算明细')).toBeInTheDocument()
  })

  it('当 budgetBreakdown 缺失部分字段时不产生 NaN 并安全显示', () => {
    const snapshot = {
      budget: 1000,
      budgetBreakdown: {
        accommodation: 500,
        attractions: 0,
        food: 300,
        total: 1000,
        transport: 200,
      },
      city: '西安',
      days: 1,
      itinerary: [],
    }

    render(<CommunityItineraryPreview mode="detail" snapshot={snapshot} />)
    expect(screen.getByText('西安')).toBeInTheDocument()
    expect(screen.getByText('查看预算明细')).toBeInTheDocument()
  })
})
