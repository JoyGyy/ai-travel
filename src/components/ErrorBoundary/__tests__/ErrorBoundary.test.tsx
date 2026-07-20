import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ErrorBoundary } from '../index'

function Bomb() {
  throw new Error('测试错误')
  return null
}

function GoodChild() {
  return <div>正常内容</div>
}

describe('ErrorBoundary', () => {
  it('正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    )
    expect(screen.getByText('正常内容')).toBeInTheDocument()
  })

  it('捕获错误并显示错误页面', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    )
    expect(screen.getByText('页面出了点问题')).toBeInTheDocument()
    expect(screen.getByText('测试错误')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })

  it('点击重试按钮可恢复', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    let shouldThrow = true

    function ConditionalBomb() {
      if (shouldThrow) throw new Error('测试错误')
      return <div>恢复成功</div>
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalBomb />
      </ErrorBoundary>,
    )

    expect(screen.getByText('页面出了点问题')).toBeInTheDocument()

    shouldThrow = false
    rerender(
      <ErrorBoundary>
        <ConditionalBomb />
      </ErrorBoundary>,
    )

    await user.click(screen.getByText('重试'))
    expect(screen.getByText('恢复成功')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})
