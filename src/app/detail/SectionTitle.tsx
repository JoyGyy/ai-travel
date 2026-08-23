'use client'

/**
 * 行程详情页 — 通用区块标题
 * 带装饰性红点的 section 标题
 */
import type { ReactNode } from 'react'

interface SectionTitleProps {
  children: ReactNode
  id?: string
}

export function SectionTitle({ children, id }: SectionTitleProps) {
  return (
    <h2
      className="flex items-center gap-2.5 pb-3 pl-1 font-serif text-base font-extrabold text-stone-900"
      id={id}
    >
      <span
        className="h-2 w-2 rounded-full bg-emerald-700 shadow-[0_0_0_4px_rgba(5,150,105,0.15)]"
      />
      {children}
    </h2>
  )
}
