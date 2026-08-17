'use client'

import { useEffect } from 'react'

/**
 * 滚动揭示 hook
 * 使用 IntersectionObserver 监听元素进入视口，添加 revealed 类触发动画
 */
export function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll(
      '.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale',
    )

    if (elements.length === 0)
      return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1,
      },
    )

    elements.forEach(el => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
