import { renderHook } from '@testing-library/react'

import { useTravelChat } from './useTravelChat'

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({ messages: [], status: 'ready' })),
}))

describe('useTravelChat', () => {
  it('返回 AI SDK 聊天状态', () => {
    const { result } = renderHook(() => useTravelChat())
    expect(result.current.status).toBe('ready')
    expect(result.current.messages).toEqual([])
  })
})
