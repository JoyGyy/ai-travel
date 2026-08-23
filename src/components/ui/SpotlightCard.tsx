'use client'

import type { HTMLAttributes, MouseEvent } from 'react'
import { useCallback, useRef } from 'react'

interface SpotlightCardProps extends HTMLAttributes<HTMLDivElement> {
  spotlightColor?: string
}

/**
 * 带有鼠标移动光晕跟随与柔和悬浮动效的手账卡片容器
 */
export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(5, 150, 105, 0.08)',
  ...props
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current)
      return
    const rect = divRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    divRef.current.style.setProperty('--mouse-x', `${x}px`)
    divRef.current.style.setProperty('--mouse-y', `${y}px`)
  }, [])

  return (
    <div
      className={`group/spotlight relative overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-700/60 ${className}`}
      onMouseMove={handleMouseMove}
      ref={divRef}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 group-hover/spotlight:opacity-100"
        style={{
          background: `radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${spotlightColor}, transparent 80%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
