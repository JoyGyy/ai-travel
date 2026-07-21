/**
 * Sentry 错误监控初始化
 *
 * 通过环境变量 VITE_SENTRY_DSN 控制，未配置时跳过初始化。
 * 配置了 Replay 采样率，用于错误发生时回放用户操作路径。
 */
import * as Sentry from '@sentry/react'

export function initSentry(): void {
  // --- 未配置 DSN 则不上报，开发环境可忽略 ---
  const dsn = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SENTRY_DSN
  if (!dsn)
    return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.2,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
