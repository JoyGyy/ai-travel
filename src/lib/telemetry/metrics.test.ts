import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  clearTelemetryEvents,
  getRecentTelemetryEvents,
  recordMapTileLatency,
  recordOfflineModeActivation,
  recordTTFT,
  recordWeatherFallbackTrigger,
} from './metrics';

vi.mock('@sentry/nextjs', () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
}));

describe('metrics telemetry APM', () => {
  beforeEach(() => {
    clearTelemetryEvents();
    vi.clearAllMocks();
  });

  it('正常记录 TTFT 并向 Sentry 添加性能面包屑', () => {
    recordTTFT(450, { city: '杭州', sessionId: 'sess-1' });

    const events = getRecentTelemetryEvents();
    expect(events).toHaveLength(1);
    expect(events[0].metric).toBe('ai_ttft');
    expect(events[0].value).toBe(450);
    expect(events[0].metadata?.city).toBe('杭州');

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'performance.ai',
        message: 'AI Stream TTFT: 450ms',
      }),
    );
  });

  it('当 TTFT 严重超标 (>5000ms) 时触发 Sentry.captureMessage 警告', () => {
    recordTTFT(5600, { city: '大理' });

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('[APM] AI 流式响应严重迟滞: 5600ms'),
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it('记录地图瓦片渲染耗时', () => {
    recordMapTileLatency(180, { city: '成都', tileCount: 16 });

    const events = getRecentTelemetryEvents();
    expect(events).toHaveLength(1);
    expect(events[0].metric).toBe('map_tile_latency');
    expect(events[0].value).toBe(180);
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'performance.map',
        message: 'Map Tile Load: 180ms',
      }),
    );
  });

  it('四级容灾天气降级达到 Level 3 时上报警告事件', () => {
    recordWeatherFallbackTrigger(3, '高德与备用 API 均超时');

    const events = getRecentTelemetryEvents();
    expect(events).toHaveLength(1);
    expect(events[0].metric).toBe('weather_fallback');
    expect(events[0].value).toBe(3);

    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      expect.stringContaining('[Fallback] 天气服务进入深度降级 (Level 3)'),
      expect.objectContaining({ level: 'warning' }),
    );
  });

  it('记录离线模式激活事件', () => {
    recordOfflineModeActivation('tunnel_weak_network');

    const events = getRecentTelemetryEvents();
    expect(events).toHaveLength(1);
    expect(events[0].metric).toBe('offline_activation');
    expect(events[0].metadata?.source).toBe('tunnel_weak_network');
  });
});
