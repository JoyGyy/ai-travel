/**
 * 前端全链路可观测性与 APM 性能度量模块 (对标携程生产监控体系)
 * 监控指标：AI 流式首字延迟 (TTFT)、地图瓦片渲染性能、四级容灾降级监控与弱网手账触发
 */

import * as Sentry from '@sentry/nextjs';

export interface TelemetryEvent {
  metric: 'ai_ttft' | 'map_tile_latency' | 'offline_activation' | 'weather_fallback';
  metadata?: Record<string, unknown>;
  timestamp: number;
  value: number;
}

// 内存度量事件队列 (用于测试检验与离线回溯)
const inMemoryEvents: TelemetryEvent[] = [];

/**
 * 记录 AI 大模型流式首字返回延迟 (Time To First Token - TTFT)
 * @param ttftMs 耗时毫秒数
 * @param metadata 城市、会话 ID 等元信息
 */
export function recordTTFT(
  ttftMs: number,
  metadata?: { city?: string; sessionId?: string | null },
): void {
  const event: TelemetryEvent = {
    metric: 'ai_ttft',
    value: Math.max(0, Math.round(ttftMs)),
    timestamp: Date.now(),
    metadata: metadata || {},
  };

  inMemoryEvents.push(event);
  if (inMemoryEvents.length > 50) {
    inMemoryEvents.shift();
  }

  // 上报至 Sentry APM 性能面包屑与监控
  try {
    Sentry.addBreadcrumb({
      category: 'performance.ai',
      message: `AI Stream TTFT: ${event.value}ms`,
      level: event.value > 3000 ? 'warning' : 'info',
      data: {
        ttftMs: event.value,
        ...metadata,
      },
    });

    // 若超过 5 秒严重劣化，捕获告警
    if (event.value > 5000) {
      Sentry.captureMessage(`[APM] AI 流式响应严重迟滞: ${event.value}ms`, {
        level: 'warning',
        extra: metadata,
      });
    }
  } catch {
    // 容错忽略上报异常
  }
}

/**
 * 记录高德地图瓦片完整渲染与加载耗时
 */
export function recordMapTileLatency(
  latencyMs: number,
  metadata?: { city?: string; tileCount?: number },
): void {
  const event: TelemetryEvent = {
    metric: 'map_tile_latency',
    value: Math.max(0, Math.round(latencyMs)),
    timestamp: Date.now(),
    metadata: metadata || {},
  };

  inMemoryEvents.push(event);

  try {
    Sentry.addBreadcrumb({
      category: 'performance.map',
      message: `Map Tile Load: ${event.value}ms`,
      level: 'info',
      data: {
        latencyMs: event.value,
        ...metadata,
      },
    });
  } catch {}
}

/**
 * 记录四级容灾天气服务降级事件 (用于第三方气象 API 稳定性大盘)
 * @param level 降级等级 (1: 高德主通道, 2: 备用高精度, 3: 历史统计推算, 4: 常态保底兜底)
 */
export function recordWeatherFallbackTrigger(
  level: number,
  reason: string,
): void {
  const event: TelemetryEvent = {
    metric: 'weather_fallback',
    value: level,
    timestamp: Date.now(),
    metadata: { reason },
  };

  inMemoryEvents.push(event);

  try {
    // 等级 >= 3 表示外部 API 均已失效，触发警告上报
    if (level >= 3) {
      Sentry.captureMessage(
        `[Fallback] 天气服务进入深度降级 (Level ${level}): ${reason}`,
        {
          level: 'warning',
          extra: { level, reason },
        },
      );
    } else {
      Sentry.addBreadcrumb({
        category: 'service.weather',
        message: `Weather service fallback level: ${level}`,
        data: { level, reason },
      });
    }
  } catch {}
}

/**
 * 记录离线手账模式激活事件 (分析国内弱网/高铁场景频次)
 */
export function recordOfflineModeActivation(source = 'auto_detect'): void {
  const event: TelemetryEvent = {
    metric: 'offline_activation',
    value: 1,
    timestamp: Date.now(),
    metadata: { source },
  };

  inMemoryEvents.push(event);

  try {
    Sentry.addBreadcrumb({
      category: 'user.offline',
      message: `Offline travel notebook activated via ${source}`,
      level: 'info',
    });
  } catch {}
}

/**
 * 获取最近采样的性能指标事件列表 (仅测试与诊断使用)
 */
export function getRecentTelemetryEvents(): TelemetryEvent[] {
  return [...inMemoryEvents];
}

/**
 * 清空内存采样队列
 */
export function clearTelemetryEvents(): void {
  inMemoryEvents.length = 0;
}
