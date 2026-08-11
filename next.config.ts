import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 图片域名白名单
  images: {
    remotePatterns: [
      { hostname: '*.aliyuncs.com' },
      { hostname: '*.githubusercontent.com' },
    ],
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
              "img-src 'self' data: blob: https://*.aliyuncs.com https://*.githubusercontent.com",
              "font-src 'self' data:",
              "connect-src 'self' https://api.siliconflow.cn https://api.deepseek.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },

  // Turbopack 根目录（next-app 作为子目录时需要指定）
  turbopack: {
    root: __dirname,
  },

  // 实验性功能
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
