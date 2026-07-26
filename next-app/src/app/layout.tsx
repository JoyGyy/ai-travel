/**
 * 根布局（Server Component）
 * 配置 Ant Design 主题、全局样式
 */
import '@ant-design/v5-patch-for-react-19'
import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AntdRegistry } from '@ant-design/nextjs-registry'

import { AntdProvider } from '@/components/AntdProvider'
import { Navigation } from '@/components/Navigation'

export const metadata: Metadata = {
  title: 'Travel AI - 智能旅行规划助手',
  description: 'AI 驱动的智能旅行规划助手，为您定制专属行程',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AntdRegistry>
          <AntdProvider>
            <Navigation />
            <main id="main-content">
              {children}
            </main>
          </AntdProvider>
        </AntdRegistry>
      </body>
    </html>
  )
}
