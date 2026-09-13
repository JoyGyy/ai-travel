import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace';
import { BudgetSummaryBar } from './BudgetSummaryBar';

describe('BudgetSummaryBar', () => {
  beforeEach(() => {
    useItineraryWorkspaceStore.getState().clearWorkspace();
    // 初始化一天的数据
    useItineraryWorkspaceStore.getState().initFromParsedRoute({
      city: '杭州',
      days: [
        {
          day: 1,
          spots: [{ name: '灵隐寺' }],
          title: '灵隐一日游',
        },
      ],
      food: ['素斋'],
      routeString: '灵隐寺',
      spots: [{ name: '灵隐寺' }],
      summary: '灵隐寺一日游',
      tips: ['提前预约'],
      transportMode: 'transit',
    });
  });

  it('正确渲染当日总花费与门票、住宿、通勤小项', () => {
    render(<BudgetSummaryBar dayNum={1} />);

    expect(screen.getByText(/第 1 天 · 出行预算明细/)).toBeInTheDocument();
    expect(screen.getByText('景区门票')).toBeInTheDocument();
    expect(screen.getByText('住宿参考')).toBeInTheDocument();
    expect(screen.getByText('市内通勤')).toBeInTheDocument();
    expect(screen.getByText(/预计总花费:/)).toBeInTheDocument();
  });

  it('切换出行人数按钮时，能够更新 store 并触发重算', () => {
    render(<BudgetSummaryBar dayNum={1} />);

    const twoPersonBtn = screen.getByRole('button', { name: '2人' });
    fireEvent.click(twoPersonBtn);

    expect(useItineraryWorkspaceStore.getState().participantCount).toBe(2);
    expect(screen.getByText(/\(人均约/)).toBeInTheDocument();
  });

  it('点击价格走势能弹出国内价格走势弹窗', () => {
    render(<BudgetSummaryBar dayNum={1} />);

    const trendBtn = screen.getByRole('button', { name: /价格走势/ });
    fireEvent.click(trendBtn);

    expect(screen.getByText(/杭州 · 国内出行价格走势比价/)).toBeInTheDocument();
    expect(screen.getByText('高铁二等座')).toBeInTheDocument();
    expect(screen.getByText('经济舱机票')).toBeInTheDocument();
  });
});
