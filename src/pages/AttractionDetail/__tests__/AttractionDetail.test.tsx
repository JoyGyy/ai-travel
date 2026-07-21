import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AttractionDetail from '../index'

vi.mock('@/api/attractions', () => ({
  fetchAttractionDetail: vi.fn(),
  favoriteAttraction: vi.fn(),
  unfavoriteAttraction: vi.fn(),
}))

const api = await import('@/api/attractions')

describe('attractionDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.fetchAttractionDetail).mockResolvedValue({
      isFavorite: false,
      attraction: {
        id: 'hangzhou-west-lake',
        name: '西湖',
        city: '杭州',
        ticketType: 'free',
        priceText: '免费开放',
        coverImage: '/images/home/trip-greece.jpg',
        summary: '杭州经典湖景',
        description: '西湖适合步行、骑行和泛舟。',
        address: '杭州市西湖区',
        openingHours: '全天',
        recommendedDuration: '2-3小时',
        tags: ['自然', '必去'],
        highlights: ['湖景', '断桥'],
        tips: ['建议错峰游览'],
        suitableFor: ['第一次到访'],
        bookingLinks: { ctrip: 'https://example.com/ctrip-west-lake' },
      },
    })
    vi.mocked(api.favoriteAttraction).mockResolvedValue({ isFavorite: true })
  })

  it('展示详情、购票入口和 AI 规划入口', async () => {
    render(
      <MemoryRouter initialEntries={['/attractions/hangzhou-west-lake']}>
        <Routes><Route path="/attractions/:id" element={<AttractionDetail />} /></Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('西湖')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /西湖，杭州景点封面/ })).toBeInTheDocument()
    expect(screen.getByText('西湖适合步行、骑行和泛舟。')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /去携程查看西湖门票，打开新窗口/ })).toHaveAttribute('href', 'https://example.com/ctrip-west-lake')
    expect(screen.getByRole('link', { name: /让 AI 规划这站/ })).toHaveAttribute('href', expect.stringContaining('/chat?prompt='))
  })

  it('可以收藏详情页景点', async () => {
    render(
      <MemoryRouter initialEntries={['/attractions/hangzhou-west-lake']}>
        <Routes><Route path="/attractions/:id" element={<AttractionDetail />} /></Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByRole('button', { name: /收藏西湖/ }))

    await waitFor(() => expect(api.favoriteAttraction).toHaveBeenCalledWith('hangzhou-west-lake'))
  })
})
