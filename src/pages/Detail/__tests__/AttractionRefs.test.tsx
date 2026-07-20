import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { SpotItem } from '@/components/SpotItem'

describe('SpotItem attraction ref', () => {
  it('有关联景点时展示详情入口', () => {
    render(
      <MemoryRouter>
        <SpotItem
          period="上午"
          data={{ spot: '西湖', description: '湖景游览', duration: '2小时', ticket: '免费', transportation: '步行' }}
          attractionRef={{ id: 'hangzhou-west-lake', name: '西湖', city: '杭州', ticketType: 'free', priceText: '免费开放' }}
        />
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: '查看西湖详情' })).toHaveAttribute('href', '/attractions/hangzhou-west-lake')
  })
})
