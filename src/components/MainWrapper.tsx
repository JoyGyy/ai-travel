'use client'

/**
 * 主内容区域包装组件
 * 根据是否显示全局导航来决定 padding-top，针对对话页提供满屏固定视口约束
 */
import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'

import { shouldShowNav } from '@/components/Navigation'

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showNav = shouldShowNav(pathname || '')
  const isChatPage = pathname?.startsWith('/chat')

  return (
    <main
      className={`${showNav ? 'pt-16' : ''} ${
        isChatPage ? 'h-dvh max-h-dvh overflow-hidden flex flex-col' : ''
      }`}
      id="main-content"
    >
      {children}
    </main>
  )
}
