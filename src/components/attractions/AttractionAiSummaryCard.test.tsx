import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AttractionAiSummaryCard } from './AttractionAiSummaryCard';

describe('AttractionAiSummaryCard', () => {
  it('在无数据时返回 null 不渲染', () => {
    const { container } = render(<AttractionAiSummaryCard />);
    expect(container.firstChild).toBeNull();
  });

  it('正确渲染亮点看点、避坑提醒与出行画像', () => {
    render(
      <AttractionAiSummaryCard
        highlights={['体验历史主题', '适合首次到访']}
        recommendedDuration="2-3小时"
        suitableFor={['第一次到访', '亲友出行']}
        tips={['建议出行前确认开放时间', '价格以官方公告为准']}
      />,
    );

    // 检查标题与标志
    expect(
      screen.getByText('AI 导游速览 · 口碑与避坑手账'),
    ).toBeInTheDocument();
    expect(screen.getByText('智能精要')).toBeInTheDocument();
    expect(screen.getByText('建议游玩 2-3小时')).toBeInTheDocument();

    // 检查亮点
    expect(screen.getByText('游客高赞看点 Top 2')).toBeInTheDocument();
    expect(screen.getByText('体验历史主题')).toBeInTheDocument();
    expect(screen.getByText('适合首次到访')).toBeInTheDocument();

    // 检查避坑
    expect(screen.getByText('行前避坑与必知提醒')).toBeInTheDocument();
    expect(screen.getByText('建议出行前确认开放时间')).toBeInTheDocument();

    // 检查适宜人群
    expect(screen.getByText('出行适宜：')).toBeInTheDocument();
    expect(screen.getByText('✓ 第一次到访')).toBeInTheDocument();
    expect(screen.getByText('✓ 亲友出行')).toBeInTheDocument();
  });

  it('在缺少某些属性时局部优雅降级渲染', () => {
    render(<AttractionAiSummaryCard tips={['仅有避坑提醒']} />);

    expect(
      screen.getByText('AI 导游速览 · 口碑与避坑手账'),
    ).toBeInTheDocument();
    expect(screen.getByText('仅有避坑提醒')).toBeInTheDocument();
    expect(screen.queryByText(/游客高赞看点/)).not.toBeInTheDocument();
    expect(screen.queryByText('出行适宜：')).not.toBeInTheDocument();
  });
});
