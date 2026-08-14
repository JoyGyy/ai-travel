import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AppProviders } from '@/components/AppProviders'
import { Navigation } from '@/components/Navigation'

import './globals.css'

export const metadata: Metadata = {
  description: 'AI 驱动的智能旅行规划助手，为您定制专属行程',
  title: 'Travel AI - 智能旅行规划助手',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProviders>
          <Navigation />
          <main id="main-content">{children}</main>
        </AppProviders>
      </body>
    </html>
  )
}
