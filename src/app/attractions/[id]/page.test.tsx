import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AttractionDetail from './page';

const mockRouterBack = vi.fn();
const mockRouterPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'chengdu-jinli' }),
  useRouter: () => ({
    back: mockRouterBack,
    push: mockRouterPush,
  }),
}));

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    className,
  }: {
    alt: string;
    className?: string;
    src: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} className={className} src={src} />
  ),
}));

vi.mock('@/api/attractions', () => ({
  fetchAttractionDetail: vi.fn().mockResolvedValue({
    attraction: {
      id: 'chengdu-jinli',
      name: '锦里古街',
      city: '成都',
      summary: '西蜀历史上最古老、最具有商业气息的街道之一',
      description: '锦里古街适合安排在成都行程中重点体验。',
      coverImage:
        'https://images.unsplash.com/photo-1543051932-6ef9fecfbc80?w=1200&q=80',
      address: '成都市武侯区武侯祠大街231号附1号',
      openingHours: '全天开放',
      recommendedDuration: '2-3小时',
      ticketType: 'free',
      priceText: '免费开放',
      tags: ['历史街区', '特色美食'],
      highlights: ['体验美食主题', '适合首次到访'],
      suitableFor: ['第一次到访', '亲友出行'],
      tips: ['建议出行前确认开放时间'],
    },
    isFavorite: false,
  }),
}));

vi.mock('@/hooks/useAttractionFavorite', () => ({
  useAttractionFavorite: () => ({
    toggleFavorite: vi.fn(),
  }),
}));

describe('AttractionDetail Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('正确渲染固定状态的返回按钮（包含 fixed 定位类与无障碍属性）', async () => {
    render(<AttractionDetail />);

    const backButton = await screen.findByRole('button', {
      name: /返回景点列表/i,
    });
    expect(backButton).toBeInTheDocument();
    expect(backButton.className).toContain('fixed');
    expect(backButton.className).toContain('top-[74px]');
    expect(backButton.className).toContain('z-40');
    expect(backButton).toHaveAttribute(
      'title',
      expect.stringContaining('返回景点列表'),
    );
  });

  it('点击固定返回按钮时触发返回行为（兜底跳转景点列表或回退历史）', async () => {
    render(<AttractionDetail />);

    const backButton = await screen.findByRole('button', {
      name: /返回景点列表/i,
    });
    fireEvent.click(backButton);

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/attractions');
    });
  });

  it('按下 ESC 键能够快捷触发返回景点列表', async () => {
    render(<AttractionDetail />);

    await screen.findByRole('button', { name: /返回景点列表/i });
    fireEvent.keyDown(window, { key: 'Escape' });

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith('/attractions');
    });
  });

  it('正确渲染携程开放联盟周边酒店与车票配套自适应直通入口', async () => {
    render(<AttractionDetail />);

    await screen.findByText('携程旅行特惠与周边出行配套');
    expect(screen.getByText('携程官方合作')).toBeInTheDocument();
    expect(screen.getByText('锦里古街周边精选酒店')).toBeInTheDocument();
    expect(screen.getByText('直达成都高铁车票查询')).toBeInTheDocument();

    const hotelLink = screen.getByRole('link', { name: /查看周边酒店/i });
    expect(hotelLink).toHaveAttribute('href', expect.stringContaining('hotels.ctrip.com'));
    expect(hotelLink).toHaveAttribute('href', expect.stringContaining('sid=attraction_detail_hotel'));

    const trainLink = screen.getByRole('link', { name: /查询携程车票/i });
    expect(trainLink).toHaveAttribute('href', expect.stringContaining('trains.ctrip.com'));
    expect(trainLink).toHaveAttribute('href', expect.stringContaining('sid=attraction_detail_train'));
  });

  it('当后端返回的 tips/highlights/tags 为字符串或非数组时能够防御性降级并不崩溃', async () => {
    const { fetchAttractionDetail } = await import('@/api/attractions');
    vi.mocked(fetchAttractionDetail).mockResolvedValueOnce({
      attraction: {
        id: 'chengdu-jinli',
        name: '锦里古街',
        city: '成都',
        summary: '西蜀街区',
        description: '测试描述',
        coverImage: 'https://example.com/test.webp',
        address: '成都市武侯区',
        openingHours: '全天开放',
        recommendedDuration: '2-3小时',
        ticketType: 'free',
        priceText: '免费开放',
        bookingLinks: {},
        tags: '历史街区' as unknown as string[],
        highlights: '单条亮点文本' as unknown as string[],
        suitableFor: '所有人' as unknown as string[],
        tips: '单条注意事项字符串' as unknown as string[],
      },
      isFavorite: false,
    });

    render(<AttractionDetail />);

    // 应该正常渲染页面，不崩溃抛出 TypeError: tips.map is not a function
    await screen.findByText('注意事项');
    expect(screen.getAllByText('单条注意事项字符串').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('单条亮点文本').length).toBeGreaterThanOrEqual(1);
  });
});

