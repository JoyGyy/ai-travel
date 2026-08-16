/**
 * Sentry 服务端配置
 * 此文件在 Node.js 服务端初始化 Sentry SDK
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // 服务端使用 SENTRY_DSN（不带 NEXT_PUBLIC 前缀）
  dsn: process.env.SENTRY_DSN,

  // 环境标识
  environment: process.env.NODE_ENV || 'development',

  // 采样率：100% 捕获所有错误
  tracesSampleRate: 1.0,

  // 调试模式
  debug: false,
})

export default Sentry
