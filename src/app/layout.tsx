import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { MainWrapper } from '@/components/MainWrapper'
import { Navigation } from '@/components/Navigation'
import { Toaster } from '@/components/ui/toaster'

import './globals.css'

export const viewport = 'width=device-width, initial-scale=1'

export const metadata: Metadata = {
  description: 'AI 驱动的智能旅行规划助手，为您定制专属行程',
  title: 'Travel AI - 智能旅行规划助手',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring"
          href="#main-content"
        >
          跳转到主要内容
        </a>
        <Navigation />
        <MainWrapper>{children}</MainWrapper>
        <Toaster />
      </body>
    </html>
  )
}
