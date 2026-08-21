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
        <Navigation />
        <MainWrapper>{children}</MainWrapper>
        <Toaster />
      </body>
    </html>
  )
}
