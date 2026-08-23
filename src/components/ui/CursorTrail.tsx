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
  const isPointerFineRef = useRef(false)

  useEffect(() => {
    // 仅在支持高精度鼠标的桌面端启用，触屏设备自动跳过
    const mediaQuery = window.matchMedia('(pointer: fine)')
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    if (!mediaQuery.matches || prefersReducedMotion.matches)
      return

    isPointerFineRef.current = true
    const canvas = canvasRef.current
    if (!canvas)
      return

    const ctx = canvas.getContext('2d')
    if (!ctx)
      return

    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    const particles: Particle[] = []
    let mouseX = -100
    let mouseY = -100
    let lastX = -100
    let lastY = -100
    let isHoveringInteractive = false

    // 监听鼠标移动
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX
      mouseY = e.clientY

      // 判断悬停元素是否可点击
      const target = e.target as HTMLElement | null
      const isClickable = target?.closest(
        'a, button, [role="button"], input, select, textarea, .cursor-pointer',
      )
      isHoveringInteractive = !!isClickable

      // 计算移动距离与速度
      const dist = Math.hypot(mouseX - lastX, mouseY - lastY)
      if (dist > 3) {
        // 生成 1~2 颗微光粒子
        const count = isHoveringInteractive ? 2 : 1
        for (let i = 0; i < count; i++) {
          const colorBase = COLORS[Math.floor(Math.random() * COLORS.length)]
          particles.push({
            alpha: 0.65,
            color: colorBase,
            decay: 0.02 + Math.random() * 0.02,
            size: isHoveringInteractive ? 4 + Math.random() * 3 : 2.5 + Math.random() * 2,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.3,
            x: mouseX + (Math.random() - 0.5) * 6,
            y: mouseY + (Math.random() - 0.5) * 6,
          })
        }
        lastX = mouseX
        lastY = mouseY
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    // 动画渲染循环
    let animationId: number
    let ringX = -100
    let ringY = -100
    let ringSize = 18

    const render = () => {
      ctx.clearRect(0, 0, width, height)

      // 1. 绘制跟随鼠标的平滑磁吸光环
      ringX += (mouseX - ringX) * 0.25
      ringY += (mouseY - ringY) * 0.25
      const targetSize = isHoveringInteractive ? 32 : 16
      ringSize += (targetSize - ringSize) * 0.2

      if (ringX > 0 && ringY > 0) {
        ctx.beginPath()
        ctx.arc(ringX, ringY, ringSize / 2, 0, Math.PI * 2)
        ctx.fillStyle = isHoveringInteractive
          ? 'rgba(5, 150, 105, 0.14)'
          : 'rgba(5, 150, 105, 0.06)'
        ctx.fill()
        ctx.strokeStyle = isHoveringInteractive
          ? 'rgba(5, 150, 105, 0.5)'
          : 'rgba(5, 150, 105, 0.2)'
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // 2. 绘制拖尾微光粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= p.decay
        p.size *= 0.96

        if (p.alpha <= 0 || p.size <= 0.5) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `${p.color}${p.alpha})`
        ctx.shadowColor = 'rgba(5, 150, 105, 0.4)'
        ctx.shadowBlur = 4
        ctx.fill()
        ctx.shadowBlur = 0
      }

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      className="pointer-events-none fixed inset-0 z-[99999] transition-opacity duration-300"
      ref={canvasRef}
    />
  )
}
