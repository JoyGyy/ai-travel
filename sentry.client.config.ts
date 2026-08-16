/**
 * Sentry 客户端配置
 * 此文件在浏览器端初始化 Sentry SDK
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  // 从环境变量获取 DSN，未配置时 SDK 不会发送数据
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 环境标识，区分开发/生产环境
  environment: process.env.NODE_ENV || 'development',

  // 采样率：100% 捕获所有错误（生产环境可调低）
  tracesSampleRate: 1.0,

  // 启用调试模式，开发时可看到更多日志
  // 生产环境建议设为 false
  debug: false,

  // 集成配置：使用默认集成即可
  // 如需自定义可在此添加 integrations 数组
})

// 导出确保模块被正确加载
export default Sentry
