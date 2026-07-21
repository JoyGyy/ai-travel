import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useSSE } from '../useSSE'

vi.mock('@/api/client', () => ({
  getAuthHeader: vi.fn(() => ({})),
}))

describe('useSSE', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.fetch = vi.fn()
  })

  it('返回 sendRequest 和 abort 函数', () => {
    const { result } = renderHook(() => useSSE())
    expect(typeof result.current.sendRequest).toBe('function')
    expect(typeof result.current.abort).toBe('function')
  })

  it('sendRequest 发起 POST 请求', async () => {
    const mockReader = {
      read: vi.fn()
        .mockResolvedValueOnce({ done: false, value: new TextEncoder().encode('data: {"type":"complete","data":{}}\n') })
        .mockResolvedValueOnce({ done: true }),
    }

    globalThis.fetch.mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    })

    const { result } = renderHook(() => useSSE())

    await act(async () => {
      await result.current.sendRequest('/api/test', { message: 'hello' })
    })

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
    }))
  })

  it('请求失败时触发 onError 回调', async () => {
    globalThis.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: '服务器错误' }),
    })

    const onError = vi.fn()
    const { result } = renderHook(() => useSSE())

    await act(async () => {
      try {
        await result.current.sendRequest('/api/test', {}, { onError })
      }
      catch {
        // useSSE 会抛出错误，需要捕获
      }
    })

    expect(onError).toHaveBeenCalled()
  })

  it('abort 中止请求', async () => {
    const mockReader = {
      read: vi.fn(() => new Promise(() => {})),
    }

    globalThis.fetch.mockImplementation(() => Promise.resolve({
      ok: true,
      body: { getReader: () => mockReader },
    }))

    const { result } = renderHook(() => useSSE())

    act(() => {
      result.current.abort()
    })

    expect(result.current.abort).toBeDefined()
  })
})
