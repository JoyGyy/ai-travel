import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import Chat from '../index'

vi.mock('@/hooks/useSSE', () => ({ useSSE: () => ({ sendRequest: vi.fn(), abort: vi.fn() }) }))
vi.mock('@/stores/chat', () => ({
  useChatStore: () => ({
    messages: [], isLoading: false, currentAgentStep: 0,
    addMessage: vi.fn(), updateLastMessage: vi.fn(), updateLastMessageSteps: vi.fn(),
    clearMessages: vi.fn(), setLoading: vi.fn(), setCurrentAgentStep: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
})

describe('Chat prompt prefill', () => {
  it('从 prompt 查询参数预填输入框', () => {
    render(<MemoryRouter initialEntries={['/chat?prompt=%E5%B8%AE%E6%88%91%E8%A7%84%E5%88%92%E8%A5%BF%E6%B9%96']}><Chat /></MemoryRouter>)

    expect(screen.getByLabelText('输入旅行问题')).toHaveValue('帮我规划西湖')
  })

  it('展示专业旅行规划师引导文案', () => {
    render(<MemoryRouter initialEntries={['/chat']}><Chat /></MemoryRouter>)

    expect(screen.getByText('我是你的 AI 旅行规划师，专注目的地、行程、预算与出行建议')).toBeInTheDocument()
    expect(screen.getByText('告诉我目的地、天数、预算或出行偏好，我来帮你做规划')).toBeInTheDocument()
    expect(screen.getByText('结合知识库与 Agent 工具，为你提供更精准的旅行建议')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('问我目的地、行程、预算、交通或美食建议...')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /北京三日游怎么安排/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /亲子游适合去哪里/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /成都旅游预算怎么规划/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /第一次去日本需要注意什么/ })).toBeInTheDocument()
  })
})
