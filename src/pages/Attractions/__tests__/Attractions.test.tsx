import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Attractions from '../index'

vi.mock('@/api/attractions', () => ({
  fetchAttractions: vi.fn(),
  favoriteAttraction: vi.fn(),
  unfavoriteAttraction: vi.fn(),
}))

const api = await import('@/api/attractions')

describe('Attractions page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.fetchAttractions).mockResolvedValue({
      items: [{
        id: 'hangzhou-west-lake',
        name: '西湖',
        city: '杭州',
        ticketType: 'free',
        priceText: '免费开放',
        coverImage: '/images/home/trip-greece.jpg',
        summary: '杭州经典湖景',
        description: '适合城市漫步。',
        address: '杭州市西湖区',
        openingHours: '全天',
        recommendedDuration: '2-3小时',
        tags: ['自然', '必去'],
        highlights: ['湖景'],
        tips: ['错峰游览'],
        suitableFor: ['第一次到访'],
        bookingLinks: {},
        isFavorite: false,
      }],
      total: 1,
      cities: ['北京', '上海', '杭州'],
      tags: ['自然', '必去'],
    })
    vi.mocked(api.favoriteAttraction).mockResolvedValue({ isFavorite: true })
  })

  it('展示景点列表并按城市筛选', async () => {
    render(<MemoryRouter><Attractions /></MemoryRouter>)

    expect(await screen.findByText('精选景点')).toBeInTheDocument()
    expect(await screen.findByText('西湖')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /西湖，杭州景点封面/ })).toBeInTheDocument()

    // Ant Design Button 在 jsdom 中 accessible name 会在 CJK 字符间插入空格（如 "杭 州"）
    fireEvent.click(screen.getByRole('button', { name: /杭\s*州/ }))

    await waitFor(() => expect(api.fetchAttractions).toHaveBeenLastCalledWith(expect.objectContaining({ city: '杭州' })))
  })

  it('可以通过搜索按钮提交关键词', async () => {
    render(<MemoryRouter><Attractions /></MemoryRouter>)

    const input = await screen.findByLabelText('搜索关键词')
    fireEvent.change(input, { target: { value: '西湖' } })
    fireEvent.click(screen.getByRole('button', { name: /搜\s*索/ }))

    await waitFor(() => expect(api.fetchAttractions).toHaveBeenLastCalledWith(expect.objectContaining({ keyword: '西湖' })))
  })

  it('可以收藏景点', async () => {
    render(<MemoryRouter><Attractions /></MemoryRouter>)

    const favoriteButton = await screen.findByRole('button', { name: /收藏西湖/ })
    fireEvent.click(favoriteButton)

    await waitFor(() => expect(api.favoriteAttraction).toHaveBeenCalledWith('hangzhou-west-lake'))
  })
})
