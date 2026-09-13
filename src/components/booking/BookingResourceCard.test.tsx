import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DomesticBookingResource } from '@/types/booking';
import { BookingResourceCard } from './BookingResourceCard';

describe('BookingResourceCard', () => {
  const mockResource: DomesticBookingResource = {
    id: 'test-booking-1',
    type: 'ticket',
    title: '灵隐飞来峰·景区门票',
    provider: '携程自营',
    originalPrice: 75,
    discountPrice: 70,
    couponAmount: 5,
    stockStatus: 'booking_required',
    tags: ['国家5A', '刷身份证入园'],
    bookingNote: '需提前预约灵隐飞来峰景区大门票',
    salesVolume: '近30天预订 4.8万+',
    bookingUrl: 'https://m.ctrip.com/webapp/ticket/test',
  };

  it('正确渲染标题、价格、优惠券与供应商', () => {
    render(<BookingResourceCard resource={mockResource} />);

    expect(screen.getByText('灵隐飞来峰·景区门票')).toBeInTheDocument();
    expect(screen.getByText('携程自营')).toBeInTheDocument();
    expect(screen.getByText('¥70')).toBeInTheDocument();
    expect(screen.getByText('¥75')).toBeInTheDocument();
    expect(screen.getByText('减¥5券')).toBeInTheDocument();
    expect(screen.getByText('刷身份证入园')).toBeInTheDocument();
  });

  it('点击展开须知能够显示预订注意事项与服务承诺', () => {
    render(<BookingResourceCard resource={mockResource} />);

    // 默认不展示展开细节
    expect(
      screen.queryByText('需提前预约灵隐飞来峰景区大门票'),
    ).not.toBeInTheDocument();

    // 点击展开
    const expandBtn = screen.getByRole('button', { name: /预约与退改/i });
    fireEvent.click(expandBtn);

    expect(
      screen.getByText('需提前预约灵隐飞来峰景区大门票'),
    ).toBeInTheDocument();
    expect(screen.getByText('官方渠道核销')).toBeInTheDocument();
  });

  it('点击加入清单按钮能够切换状态视觉反馈', () => {
    render(<BookingResourceCard resource={mockResource} />);

    const lockBtn = screen.getByRole('button', { name: /加入预算清单/i });
    expect(lockBtn).toBeInTheDocument();

    fireEvent.click(lockBtn);
    expect(screen.getByText('已加入清单')).toBeInTheDocument();

    fireEvent.click(lockBtn);
    expect(screen.getByText('加入预算清单')).toBeInTheDocument();
  });
});
