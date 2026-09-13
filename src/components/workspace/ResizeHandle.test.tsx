import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ResizeHandle } from './ResizeHandle'

describe('ResizeHandle', () => {
  it('正确渲染具有可访问性的分隔条角色与属性', () => {
    const handleResize = vi.fn()

    render(
      <ResizeHandle
        ariaLabel="调节对话栏宽度"
        maxWidth={650}
        minWidth={300}
        onResize={handleResize}
        width={400}
      />,
    )

    const separator = screen.getByRole('separator', { name: '调节对话栏宽度' })
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveAttribute('aria-orientation', 'vertical')
    expect(separator).toHaveAttribute('aria-valuenow', '400')
  })

  it('在按下并拖拽移动时正确计算并限制宽度', () => {
    const handleResize = vi.fn()
    const handleResizeEnd = vi.fn()

    render(
      <ResizeHandle
        direction="right"
        maxWidth={600}
        minWidth={300}
        onResize={handleResize}
        onResizeEnd={handleResizeEnd}
        width={400}
      />,
    )

    const separator = screen.getByRole('separator')

    // 模拟 pointerdown
    fireEvent.pointerDown(separator, { clientX: 400 })

    // 模拟 pointermove (向右拖动 100px)
    fireEvent(
      window,
      new MouseEvent('pointermove', {
        clientX: 500,
      }),
    )

    expect(handleResize).toHaveBeenCalledWith(500)

    // 模拟超出最大宽度
    fireEvent(
      window,
      new MouseEvent('pointermove', {
        clientX: 800,
      }),
    )
    expect(handleResize).toHaveBeenCalledWith(600)

    // 模拟 pointerup 结束拖拽
    fireEvent(window, new MouseEvent('pointerup'))
    expect(handleResizeEnd).toHaveBeenCalledWith(600)
  })
})
