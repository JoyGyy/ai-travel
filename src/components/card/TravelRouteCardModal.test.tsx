import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ParsedRouteData } from '@/lib/map/route-parser';
import { TravelRouteCardModal } from './TravelRouteCardModal';

const mockRouterPush = vi.fn();
const mockToast = {
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

vi.mock('@/hooks/useAppToast', () => ({
  useAppToast: () => mockToast,
}));

const mockCreateCommunityPost = vi.fn().mockResolvedValue({ id: 'post-123' });
vi.mock('@/api/community', () => ({
  createCommunityPost: (...args: unknown[]) => mockCreateCommunityPost(...args),
}));

const mockExportElementToPng = vi
  .fn()
  .mockResolvedValue('data:image/png;base64,mock');
vi.mock('@/lib/utils/export-image', () => ({
  exportElementToPng: (...args: unknown[]) => mockExportElementToPng(...args),
}));

let mockAuthState = {
  _hasHydrated: true,
  user: { id: 'u1', nickname: '旅行者' } as {
    id: string;
    nickname: string;
  } | null,
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: (selector: (state: typeof mockAuthState) => unknown) =>
    selector(mockAuthState),
}));

describe('TravelRouteCardModal', () => {
  const multiDayRouteData: ParsedRouteData = {
    city: '成都',
    days: [
      {
        day: 1,
        title: 'Day 1：锦里古街与武侯祠深度游',
        spots: [
          { name: '武侯祠', durationText: '2小时', description: '三国圣地' },
          {
            name: '锦里古街',
            durationText: '2.5小时',
            description: '民俗休闲街区',
          },
        ],
      },
      {
        day: 2,
        title: 'Day 2：熊猫基地与宽窄巷子',
        spots: [
          {
            name: '大熊猫繁育研究基地',
            durationText: '3小时',
            description: '看国宝大熊猫',
          },
          {
            name: '宽窄巷子',
            durationText: '2小时',
            description: '古色古香的慢时光',
          },
          {
            name: '人民公园',
            durationText: '1.5小时',
            description: '喝盖碗茶体验慢生活',
          },
        ],
      },
    ],
    food: ['钵钵鸡', '麻婆豆腐', '蛋烘糕'],
    isItinerary: true,
    routeString: '武侯祠 ➔ 锦里古街 ➔ 大熊猫繁育研究基地 ➔ 宽窄巷子 ➔ 人民公园',
    spots: [
      { name: '武侯祠', durationText: '2小时' },
      { name: '锦里古街', durationText: '2.5小时' },
      { name: '大熊猫繁育研究基地', durationText: '3小时' },
      { name: '宽窄巷子', durationText: '2小时' },
      { name: '人民公园', durationText: '1.5小时' },
    ],
    summary: '成都市区48小时文化美食体验路线',
    tips: ['建议提前线上预约大熊猫基地门票', '宽窄巷子夜景更具韵味'],
    transportMode: 'driving',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      _hasHydrated: true,
      user: { id: 'u1', nickname: '旅行者' },
    };
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('多天行程应正确按天分组展示打卡链路与天数徽章', () => {
    render(
      <TravelRouteCardModal
        isOpen={true}
        onClose={vi.fn()}
        routeData={multiDayRouteData}
      />,
    );

    // 顶部概览
    expect(screen.getByText('手账旅行路书导出与分享')).toBeInTheDocument();
    expect(screen.getByText(/2 天行程规划/)).toBeInTheDocument();
    expect(screen.getByText(/共 5 处精选打卡点/)).toBeInTheDocument();

    // 按天分组标签
    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('Day 2')).toBeInTheDocument();
    expect(
      screen.getByText('Day 1：锦里古街与武侯祠深度游'),
    ).toBeInTheDocument();
    expect(screen.getByText('Day 2：熊猫基地与宽窄巷子')).toBeInTheDocument();

    // 具体的景点打卡点
    expect(screen.getByText('武侯祠')).toBeInTheDocument();
    expect(screen.getByText('锦里古街')).toBeInTheDocument();
    expect(screen.getByText('大熊猫繁育研究基地')).toBeInTheDocument();
    expect(screen.getByText('宽窄巷子')).toBeInTheDocument();
    expect(screen.getByText('人民公园')).toBeInTheDocument();

    // 美食与避坑贴士
    expect(screen.getByText('🍜 钵钵鸡')).toBeInTheDocument();
    expect(
      screen.getByText('建议提前线上预约大熊猫基地门票'),
    ).toBeInTheDocument();
  });

  it('单日行程或无 days 结构时应兜底作为单日呈现', () => {
    const singleDayData: ParsedRouteData = {
      city: '杭州',
      days: [],
      food: ['西湖醋鱼', '龙井虾仁'],
      isItinerary: true,
      routeString: '西湖 ➔ 灵隐寺',
      spots: [{ name: '西湖' }, { name: '灵隐寺' }],
      summary: '西湖一日漫游',
      tips: ['建议轻装出行'],
      transportMode: 'walking',
    };

    render(
      <TravelRouteCardModal
        isOpen={true}
        onClose={vi.fn()}
        routeData={singleDayData}
      />,
    );

    expect(screen.getByText('Day 1')).toBeInTheDocument();
    expect(screen.getByText('杭州精选游玩打卡')).toBeInTheDocument();
    expect(screen.getByText('西湖')).toBeInTheDocument();
    expect(screen.getByText('灵隐寺')).toBeInTheDocument();
  });

  it('点击「复制路书文案」应向剪贴板写入分日结构化文本并提示成功', async () => {
    render(
      <TravelRouteCardModal
        isOpen={true}
        onClose={vi.fn()}
        routeData={multiDayRouteData}
      />,
    );

    const copyBtn = screen.getByRole('button', { name: /复制路书文案/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedText = vi.mocked(navigator.clipboard.writeText).mock
      .calls[0][0];
    expect(copiedText).toContain('【Day 1 · Day 1：锦里古街与武侯祠深度游】');
    expect(copiedText).toContain('1. 武侯祠 (2小时) ➔ 2. 锦里古街 (2.5小时)');
    expect(copiedText).toContain('【Day 2 · Day 2：熊猫基地与宽窄巷子】');
    expect(mockToast.success).toHaveBeenCalledWith('已复制手账路书文字内容！');
  });

  it('点击「保存卡片到本地」应调用 exportElementToPng 导出图片', async () => {
    render(
      <TravelRouteCardModal
        isOpen={true}
        onClose={vi.fn()}
        routeData={multiDayRouteData}
      />,
    );

    const saveBtn = screen.getByRole('button', { name: /保存卡片到本地/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockExportElementToPng).toHaveBeenCalledTimes(1);
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('手账卡片已成功保存至本地相册/下载！'),
      );
    });
  });

  it('未登录时点击「一键分享到社区」应提示并跳转到登录页', async () => {
    mockAuthState = {
      _hasHydrated: true,
      user: null,
    };

    render(
      <TravelRouteCardModal
        isOpen={true}
        onClose={vi.fn()}
        routeData={multiDayRouteData}
      />,
    );

    const shareBtn = screen.getByRole('button', { name: /一键分享到社区/i });
    fireEvent.click(shareBtn);

    expect(mockToast.info).toHaveBeenCalledWith('请先登录后再分享到旅友社区');
    expect(mockRouterPush).toHaveBeenCalledWith('/login');
    expect(mockCreateCommunityPost).not.toHaveBeenCalled();
  });

  it('已登录时点击「一键分享到社区」应结构化提交分日行程快照并导航到新贴', async () => {
    const handleClose = vi.fn();
    render(
      <TravelRouteCardModal
        isOpen={true}
        onClose={handleClose}
        routeData={multiDayRouteData}
      />,
    );

    const shareBtn = screen.getByRole('button', { name: /一键分享到社区/i });
    fireEvent.click(shareBtn);

    await waitFor(() => {
      expect(mockCreateCommunityPost).toHaveBeenCalledTimes(1);
    });

    const payload = mockCreateCommunityPost.mock.calls[0][0];
    expect(payload.city).toBe('成都');
    expect(payload.title).toContain('【成都 2日游手账】');
    expect(payload.itinerarySnapshot.days).toBe(2);
    expect(payload.itinerarySnapshot.itinerary).toHaveLength(2);
    expect(payload.itinerarySnapshot.itinerary[0].spots).toHaveLength(2);
    expect(payload.itinerarySnapshot.itinerary[1].spots).toHaveLength(3);

    expect(mockToast.success).toHaveBeenCalledWith('🎉 已成功发布到社区广场！');
    expect(handleClose).toHaveBeenCalled();
    expect(mockRouterPush).toHaveBeenCalledWith('/community/post-123');
  });
});
