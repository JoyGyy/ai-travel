/**
 * Sentry Edge Runtime 配置
 * 此文件在 Edge Runtime（如 Middleware）中初始化 Sentry SDK
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // Edge Runtime 使用 SENTRY_DSN
  dsn: process.env.SENTRY_DSN,

  // 环境标识
  environment: process.env.NODE_ENV || 'development',

  // 采样率：100% 捕获所有错误
  tracesSampleRate: 1.0,

  // 调试模式
  debug: false,
})

export default Sentry
