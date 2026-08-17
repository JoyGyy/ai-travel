import { act, renderHook } from '@testing-library/react'

import { useSearchCache } from './useSearchCache'

describe('useSearchCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('首次调用 fetcher，后续命中缓存', async () => {
    const fetcher = vi.fn().mockResolvedValue('data-1')
    const { result } = renderHook(() => useSearchCache<string>())

    // 第一次调用：执行 fetcher
    const first = await result.current.getCachedOrFetch('key-1', fetcher)
    expect(first).toBe('data-1')
    expect(fetcher).toHaveBeenCalledTimes(1)

    // 第二次调用：命中缓存，不执行 fetcher
    const second = await result.current.getCachedOrFetch('key-1', fetcher)
    expect(second).toBe('data-1')
    expect(fetcher).toHaveBeenCalledTimes(1)
  })

  it('不同 key 分别缓存', async () => {
    const fetcher = vi.fn().mockImplementation((key: string) => Promise.resolve(`data-${key}`))
    const { result } = renderHook(() => useSearchCache<string>())

    await result.current.getCachedOrFetch('a', () => fetcher('a'))
    await result.current.getCachedOrFetch('b', () => fetcher('b'))

    expect(fetcher).toHaveBeenCalledTimes(2)

    // 再次获取已缓存的 key，不调用 fetcher
    await result.current.getCachedOrFetch('a', () => fetcher('a'))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('缓存过期后重新调用 fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue('data-1')
    const { result } = renderHook(() => useSearchCache<string>({ ttl: 1000 }))

    await result.current.getCachedOrFetch('key-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    // 推进时间超过 TTL
    act(() => {
      vi.advanceTimersByTime(1500)
    })

    await result.current.getCachedOrFetch('key-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('invalidate 后重新调用 fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue('data-1')
    const { result } = renderHook(() => useSearchCache<string>())

    await result.current.getCachedOrFetch('key-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.invalidate('key-1')
    })

    await result.current.getCachedOrFetch('key-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('clearCache 后重新调用 fetcher', async () => {
    const fetcher = vi.fn().mockResolvedValue('data-1')
    const { result } = renderHook(() => useSearchCache<string>())

    await result.current.getCachedOrFetch('key-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.clearCache()
    })

    await result.current.getCachedOrFetch('key-1', fetcher)
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('fetcher 抛出错误时不会写入缓存', async () => {
    const error = new Error('network error')
    const failingFetcher = vi.fn().mockRejectedValue(error)
    const { result } = renderHook(() => useSearchCache<string>())

    await expect(result.current.getCachedOrFetch('key-1', failingFetcher)).rejects.toThrow(
      'network error',
    )

    // 错误不缓存，再次调用仍执行 fetcher
    await expect(result.current.getCachedOrFetch('key-1', failingFetcher)).rejects.toThrow()
    expect(failingFetcher).toHaveBeenCalledTimes(2)
  })

  it('getStats 返回缓存统计', async () => {
    const fetcher = vi.fn().mockResolvedValue('data-1')
    const { result } = renderHook(() => useSearchCache<string>())

    await result.current.getCachedOrFetch('key-1', fetcher)

    const stats = result.current.getStats()
    expect(stats.total).toBe(1)
    expect(stats.valid).toBe(1)
  })
})
