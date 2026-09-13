import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TravelMapSkeleton } from './TravelMapSkeleton';

describe('TravelMapSkeleton', () => {
  it('正确渲染具有无障碍角色的地图骨架状态与指定城市名称', () => {
    render(<TravelMapSkeleton cityName="杭州" />);

    const statusEl = screen.getByRole('status', { name: '地图加载中' });
    expect(statusEl).toBeInTheDocument();
    expect(screen.getByText('高德路网与打卡点加载中...')).toBeInTheDocument();
    expect(screen.getByText(/正在就绪【杭州】/)).toBeInTheDocument();
  });
});
