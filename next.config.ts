import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  // Turbopack 配置 - 明确指定项目根目录
  turbopack: {
    root: import.meta.dirname,
  },

  // 图片域名白名单
  // 景点图片已全部改为本地 /images/attractions/，远程图片源已移除。
  images: {
    remotePatterns: [],
  },

  // 安全响应头
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.siliconflow.cn",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // 实验性功能
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // 显式声明 instantInsights（Next 16 默认值），规避 16.3.1 中
    // base-server.js 在未配置时直接访问 undefined.validationLevel 的回归崩溃。
    instantInsights: {
      validationLevel: 'warning',
    },
  },
}

// 开发环境跳过 Sentry 包装，避免 WebSocket payload 超限
// @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
const config = process.env.NODE_ENV === 'development'
  ? nextConfig
  : withSentryConfig(nextConfig, {
    // Source Map 上传配置
    // 配置 SENTRY_AUTH_TOKEN 后可启用自动上传
    // authToken: process.env.SENTRY_AUTH_TOKEN,

    // 组织和项目名称（需要在 Sentry 中创建）
    // org: process.env.SENTRY_ORG,
    // project: process.env.SENTRY_PROJECT,

    // 仅在生产环境上传 Source Map
    // hideSourceMaps: true,

    // 自动创建 Release
    // autoInstrumentServerFunctions: true,
  })

export default config
