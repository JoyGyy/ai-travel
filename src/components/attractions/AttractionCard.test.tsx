import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AttractionCard,
  formatTicketPrice,
} from './AttractionCard';

describe('formatTicketPrice', () => {
  it('免费门票应统一规范为「免费开放」', () => {
    const res = formatTicketPrice('free', '免费');
    expect(res.isFree).toBe(true);
    expect(res.label).toBe('免费开放');
  });

  it('长文本价格（如「参考价 ¥108，以平台实际为准」）应提取紧凑金额与平台说明', () => {
    const res = formatTicketPrice('paid', '参考价 ¥108，以平台实际为准');
    expect(res.isFree).toBe(false);
    expect(res.label).toBe('¥108 起');
    expect(res.subNote).toBe('以平台为准');
  });

  it('套票浮动长文本（如「参考价随船票套票变化，以平台实际为准」）应提取为「套票 / 浮动价」', () => {
    const res = formatTicketPrice(
      'paid',
      '参考价随船票套票变化，以平台实际为准',
    );
    expect(res.isFree).toBe(false);
    expect(res.label).toBe('套票 / 浮动价');
    expect(res.subNote).toBe('以平台为准');
  });

  it('纯元价格（如「60元」）应正确提取并格式化', () => {
    const res = formatTicketPrice('paid', '60元');
    expect(res.isFree).toBe(false);
    expect(res.label).toBe('¥60 起');
  });

  it('未提供价格文本时应兜底为「以景区为准」', () => {
    const res = formatTicketPrice('paid', undefined);
    expect(res.isFree).toBe(false);
    expect(res.label).toBe('以景区为准');
  });
});

describe('AttractionCard 组件渲染', () => {
  const mockAttraction = {
    city: '三亚',
    coverImage: '/images/test.jpg',
    id: 'sanya-nanshan',
    isFavorite: false,
    name: '南山文化旅游区',
    priceText: '参考价 ¥108，以平台实际为准',
    rating: 4.8,
    summary: '著名的海滨佛教文化胜地，拥有108米海上观音圣像。',
    tags: ['佛教文化', '地标打卡', '海景祈福'],
    ticketType: 'paid' as const,
  };

  it('应舒展展示完整标题，并结构化展示价格与评分', () => {
    render(<AttractionCard attraction={mockAttraction} />);

    // 标题独占展示，不被挤压
    expect(screen.getByText('南山文化旅游区')).toBeInTheDocument();
    // 价格结构化格式化
    expect(screen.getByText('¥108 起')).toBeInTheDocument();
    expect(screen.getByText('(以平台为准)')).toBeInTheDocument();
    // 城市与标签
    expect(screen.getByText('📍 三亚')).toBeInTheDocument();
    expect(screen.getByText('#佛教文化')).toBeInTheDocument();
  });

  it('点击收藏按钮应触发 onToggleFavorite 回调', () => {
    const handleToggle = vi.fn();
    render(
      <AttractionCard
        attraction={mockAttraction}
        onToggleFavorite={handleToggle}
      />,
    );

    const button = screen.getByRole('button', { name: '添加至心愿收藏' });
    fireEvent.click(button);
    expect(handleToggle).toHaveBeenCalledWith(mockAttraction);
  });

  it('在 profile 页面 compact 模式且 showRemoveFavorite 时应正确触发 onRemoveFavorite', () => {
    const handleRemove = vi.fn();
    render(
      <AttractionCard
        attraction={{ ...mockAttraction, isFavorite: true }}
        onRemoveFavorite={handleRemove}
        showRemoveFavorite={true}
        size="compact"
      />,
    );

    const removeBtn = screen.getByRole('button', { name: '取消收藏' });
    fireEvent.click(removeBtn);
    expect(handleRemove).toHaveBeenCalledWith('sanya-nanshan');
  });
});
