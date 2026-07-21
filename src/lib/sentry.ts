/**
 * Sentry 错误监控初始化
 * 通过环境变量 VITE_SENTRY_DSN 控制，未配置时不上报
 */
import * as Sentry from '@sentry/react'

export function initSentry(): void {
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
