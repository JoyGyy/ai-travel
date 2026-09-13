import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { WorkspaceLeg } from '@/stores/itineraryWorkspace';
import { CommuteTimelineSegment } from './CommuteTimelineSegment';

describe('CommuteTimelineSegment', () => {
  const mockLeg: WorkspaceLeg = {
    fromSpotId: 'spot-1',
    fromSpotName: '断桥残雪',
    toSpotId: 'spot-2',
    toSpotName: '灵隐寺',
    distanceKm: 8.5,
    durationMins: 25,
    durationText: '25分钟',
    mode: 'driving',
  };

  it('默认渲染简要耗时与通勤距离标签', () => {
    render(<CommuteTimelineSegment city="杭州" leg={mockLeg} />);

    expect(screen.getByText('25分钟')).toBeInTheDocument();
    expect(screen.getByText('8.5公里')).toBeInTheDocument();
  });

  it('点击展开后展示路费估算与高德 App 唤起直达链接', () => {
    render(<CommuteTimelineSegment city="杭州" leg={mockLeg} />);

    const toggleBtn = screen.getByRole('button');
    fireEvent.click(toggleBtn);

    // 验证起止打卡点名称
    expect(screen.getByText(/断桥残雪 ➔ 灵隐寺/)).toBeInTheDocument();

    // 验证路费参考
    expect(screen.getByText(/通勤估算参考:/)).toBeInTheDocument();
    expect(screen.getByText(/网约车打车/)).toBeInTheDocument();

    // 验证原生唤端 Scheme 链接
    const appSchemeLink = screen.getByRole('link', { name: '高德 App 直达' });
    expect(appSchemeLink).toBeInTheDocument();
    expect(appSchemeLink).toHaveAttribute(
      'href',
      expect.stringContaining('amapuri://route/plan/'),
    );

    // 验证网页版链接
    const webLink = screen.getByRole('link', { name: '高德网页版' });
    expect(webLink).toBeInTheDocument();
    expect(webLink).toHaveAttribute(
      'href',
      expect.stringContaining('uri.amap.com/navigation'),
    );
  });
});
