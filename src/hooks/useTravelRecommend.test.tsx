import { act, renderHook } from '@testing-library/react'

import { useTravelRecommend } from './useTravelRecommend'

describe('useTravelRecommend', () => {
  it('初始状态为空', () => {
    const { result } = renderHook(() => useTravelRecommend())
    expect(result.current.content).toBe('')
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('请求失败时写入错误', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('bad', { status: 500 })))
    const { result } = renderHook(() => useTravelRecommend())

    await act(async () => {
      await result.current.requestRecommend({ city: '杭州', budget: 3000, days: 3 })
    })

    expect(result.current.error).toBe('请求失败：500')
  })
})
