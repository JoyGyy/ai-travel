'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  alpha: number
  color: string
  decay: number
  size: number
  vx: number
  vy: number
  x: number
  y: number
}

const COLORS = [
  'rgba(5, 150, 105, ', // 翡翠绿
  'rgba(16, 185, 129, ', // 薄荷绿
  'rgba(217, 119, 6, ', // 暖阳琥珀
  'rgba(245, 158, 11, ', // 金沙黄
]

export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    // 仅在支持高精度鼠标的桌面端启用，触屏设备自动跳过
    const mediaQuery = window.matchMedia('(pointer: fine)')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!mediaQuery.matches || prefersReducedMotion.matches)
      return

    const canvas = canvasRef.current
    if (!canvas)
      return

    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx)
      return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize, { passive: true })

    const particles: Particle[] = []
    let mouseX = -100
    let mouseY = -100
    let lastX = -100
    let lastY = -100
    let isHovering = false
    let isRunning = false
    let animationId = 0

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 绘制并更新粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay
        p.size *= 0.94

        if (p.alpha <= 0 || p.size <= 0.5) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.alpha})`
        ctx.fill()
      }

      // 如果粒子全部消散且鼠标静止，暂停渲染循环以节省 100% CPU
      if (particles.length > 0) {
        animationId = requestAnimationFrame(render)
      }
      else {
        isRunning = false
      }
    }

    const startLoop = () => {
      if (!isRunning) {
        isRunning = true
        animationId = requestAnimationFrame(render)
      }
    }

    // 节流处理鼠标移动
    let lastCheckTime = 0
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      const now = performance.now()
      // 每 150ms 节流检测一次是否悬停在可点击元素上
      if (now - lastCheckTime > 150) {
        const target = e.target as HTMLElement | null
        isHovering = !!target?.closest('a, button, [role="button"], input, select, textarea, .cursor-pointer')
        lastCheckTime = now
      }

      const dist = Math.hypot(mouseX - lastX, mouseY - lastY)
      // 移动距离大于 12px 时生成 1 颗粒子
      if (dist > 12) {
        if (particles.length < 25) { // 限制最大同屏粒子数
          const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)]
          particles.push({
            alpha: 0.6,
            color: colorBase,
            decay: 0.035,
            size: isHovering ? 3.5 : 2.2,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2 - 0.2,
            x: mouseX,
            y: mouseY,
          })
        }
        lastX = mouseX
        lastY = mouseY
      }

      startLoop()
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      className="pointer-events-none fixed inset-0 z-[99999]"
      ref={canvasRef}
    />
  )
}
