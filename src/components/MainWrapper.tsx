'use client'

/**
 * 主内容区域包装组件
 * 根据是否显示全局导航来决定 padding-top
 */
import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'

import { shouldShowNav } from '@/components/Navigation'

export function MainWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showNav = shouldShowNav(pathname || '')

  return (
    <main className={showNav ? 'pt-[64px]' : ''} id="main-content">
      {children}
    </main>
  )
}
