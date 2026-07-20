import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Chat from '../index'

vi.mock('@/hooks/useSSE', () => ({ useSSE: () => ({ sendRequest: vi.fn(), abort: vi.fn() }) }))
vi.mock('@/stores/chat', () => ({
  useChatStore: () => ({
    messages: [], isLoading: false, currentAgentStep: 0,
    addMessage: vi.fn(), updateLastMessage: vi.fn(), updateLastMessageSteps: vi.fn(),
    clearMessages: vi.fn(), setLoading: vi.fn(), setCurrentAgentStep: vi.fn(),
  }),
}))

describe('Chat prompt prefill', () => {
  it('从 prompt 查询参数预填输入框', () => {
    render(<MemoryRouter initialEntries={['/chat?prompt=%E5%B8%AE%E6%88%91%E8%A7%84%E5%88%92%E8%A5%BF%E6%B9%96']}><Chat /></MemoryRouter>)

    expect(screen.getByLabelText('输入旅行问题')).toHaveValue('帮我规划西湖')
  })
})
