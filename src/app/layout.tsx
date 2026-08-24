import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Script from 'next/script'

import { MainWrapper } from '@/components/MainWrapper'
import { Navigation } from '@/components/Navigation'
import { CursorTrail } from '@/components/ui/CursorTrail'
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
      <head>
        {/* Umami 访客量与停留时长统计分析 */}
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="147a6007-9dae-4843-a7c7-8bdb360b8570"
          strategy="afterInteractive"
        />
      </head>
      <body>
        <CursorTrail />
        <Navigation />
        <MainWrapper>{children}</MainWrapper>
        <Toaster />
      </body>
    </html>
  )
}
