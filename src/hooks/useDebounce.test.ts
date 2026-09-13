import { act, renderHook } from '@testing-library/react'

import { useDebounce, useDebouncedCallback } from './useDebounce'

// 使用真实定时器测试防抖行为
describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('应该在延迟后执行函数', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 300))

    act(() => {
      result.current('hello')
    })

    // 未到延迟时间，不应执行
    expect(fn).not.toHaveBeenCalled()

    // 推进时间到 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('hello')
  })

  it('连续调用只执行最后一次', () => {
    const fn = vi.fn()
    const { result } = renderHook(() => useDebounce(fn, 300))

    act(() => {
      result.current('a')
      result.current('b')
      result.current('c')
    })

    // 推进 100ms（未到 300ms），再次调用
    act(() => {
      vi.advanceTimersByTime(100)
      result.current('d')
    })

    // 推进到 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('d')
  })

  it('延迟期间函数变化时使用最新的函数', () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()

    const { rerender, result } = renderHook(({ f }) => useDebounce(f, 300), {
      initialProps: { f: fn1 },
    })

    // 调用防抖函数（此时引用 fn1）
    act(() => {
      result.current('first')
    })

    // 延迟期间 fn 变化（重新渲染，传入 fn2）
    act(() => {
      rerender({ f: fn2 })
    })

    // 再次调用（应使用 fn2）
    act(() => {
      result.current('second')
    })

    // 推进时间到 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // 只有 fn2 被调用，且参数是第二次的值
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(fn2).toHaveBeenCalledWith('second')
  })

  it('组件卸载后不执行定时器', () => {
    const fn = vi.fn()
    const { result, unmount } = renderHook(() => useDebounce(fn, 300))

    act(() => {
      result.current('hello')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(500)
    })

    expect(fn).not.toHaveBeenCalled()
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('延迟期间函数变化时执行最新闭包函数', async () => {
    const fn1 = vi.fn(async (x: string) => `fn1-${x}`)
    const fn2 = vi.fn(async (x: string) => `fn2-${x}`)

    const { rerender, result } = renderHook(({ f }) => useDebouncedCallback(f, 300), {
      initialProps: { f: fn1 },
    })

    let promiseResult: Promise<string> | undefined
    act(() => {
      promiseResult = result.current.debouncedFn('test')
    })

    // 重新渲染，改变传入的 callback
    act(() => {
      rerender({ f: fn2 })
    })

    let res: string | undefined
    await act(async () => {
      vi.advanceTimersByTime(300)
      res = await promiseResult
    })

    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledTimes(1)
    expect(res).toBe('fn2-test')
  })
})
