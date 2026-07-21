import { render, screen, waitFor } from '@testing-library/react'
import { Suspense } from 'react'
import { describe, expect, it } from 'vitest'

import { ChatBubble } from '../index'

/**
 * 包裹 Suspense 以支持 React.lazy 动态导入
 */
function renderWithSuspense(ui: React.ReactElement) {
  return render(<Suspense fallback={<span>加载中...</span>}>{ui}</Suspense>)
}

describe('chat bubble 组件', () => {
  it('用户消息渲染为纯文本', () => {
    renderWithSuspense(<ChatBubble role="user" content="你好" />)
    expect(screen.getByText('你好')).toBeInTheDocument()
  })

  it('用户消息使用 user 样式类', () => {
    const { container } = renderWithSuspense(<ChatBubble role="user" content="测试" />)
    expect(container.querySelector('.chat-bubble--user')).toBeInTheDocument()
    expect(container.querySelector('.chat-bubble--ai')).not.toBeInTheDocument()
  })

  it('assistant 消息使用 ai 样式类', async () => {
    const { container } = renderWithSuspense(<ChatBubble role="assistant" content="回复" />)
    expect(container.querySelector('.chat-bubble--ai')).toBeInTheDocument()
    expect(container.querySelector('.chat-bubble--user')).not.toBeInTheDocument()
  })

  it('assistant 消息显示机器人头像', () => {
    const { container } = renderWithSuspense(<ChatBubble role="assistant" content="有头像" />)
    const avatar = container.querySelector('.chat-bubble__avatar')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
  })

  it('用户消息不显示头像', () => {
    const { container } = renderWithSuspense(<ChatBubble role="user" content="无头像" />)
    expect(container.querySelector('.chat-bubble__avatar')).not.toBeInTheDocument()
  })

  it('assistant 消息通过 react-markdown 渲染 Markdown 内容', async () => {
    renderWithSuspense(<ChatBubble role="assistant" content="**加粗文本**" />)
    await waitFor(() => {
      expect(screen.getByText('加粗文本')).toBeInTheDocument()
    })
    expect(screen.getByText('加粗文本').tagName).toBe('STRONG')
  })

  it('assistant 消息渲染 Markdown 链接', async () => {
    renderWithSuspense(<ChatBubble role="assistant" content="[链接](https://example.com)" />)
    await waitFor(() => {
      expect(screen.getByText('链接')).toBeInTheDocument()
    })
    expect(screen.getByText('链接').closest('a')).toHaveAttribute('href', 'https://example.com')
  })

  it('assistant 消息包含 markdown-body 容器', async () => {
    const { container } = renderWithSuspense(<ChatBubble role="assistant" content="内容" />)
    await waitFor(() => {
      expect(container.querySelector('.markdown-body')).toBeInTheDocument()
    })
  })
})
