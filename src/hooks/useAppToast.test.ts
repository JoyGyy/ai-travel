import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { toast } from '@/hooks/use-toast';
import { useAppToast } from './useAppToast';

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useAppToast', () => {
  it('应保持引用的引用稳定性（useMemo）', () => {
    const { rerender, result } = renderHook(() => useAppToast());
    const initialToast = result.current;
    rerender();
    expect(result.current).toBe(initialToast);
  });

  it('调用 success 应触发操作成功通知', () => {
    const { result } = renderHook(() => useAppToast());
    result.current.success('保存成功');
    expect(toast).toHaveBeenCalledWith({
      description: '保存成功',
      title: '操作成功',
    });
  });

  it('调用 error 应触发 destructive 样式失败通知', () => {
    const { result } = renderHook(() => useAppToast());
    result.current.error('保存失败');
    expect(toast).toHaveBeenCalledWith({
      description: '保存失败',
      title: '操作失败',
      variant: 'destructive',
    });
  });

  it('调用 info 应触发普通提示通知', () => {
    const { result } = renderHook(() => useAppToast());
    result.current.info('请先登录');
    expect(toast).toHaveBeenCalledWith({
      description: '请先登录',
      title: '提示',
    });
  });
});
