/**
 * useDebounce Hook
 * 将频繁触发的函数（如搜索输入）转为防抖版本，
 * 用户停止输入 delay 毫秒后才真正执行。
 * 组件卸载时自动清除未执行的定时器，避免内存泄漏。
 *
 * @example
 * const debouncedSearch = useDebounce(fetchWeather, 300)
 * // 输入时调用 debouncedSearch(value)，停止输入 300ms 后才触发 fetchWeather
 */
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 防抖 Hook
 * @param fn 需要防抖的函数
 * @param delay 防抖延迟（毫秒）
 * @returns 防抖后的函数
 */
export function useDebounce<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  delay: number,
): (...args: TArgs) => void {
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  const debouncedFn = useCallback(
    (...args: TArgs) => {
      // 清除之前的定时器
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }

      // 设置新的定时器
      timerRef.current = setTimeout(() => {
        fn(...args)
        timerRef.current = null
      }, delay)
    },
    [fn, delay],
  )

  // 组件卸载时清除未执行的定时器，防止内存泄漏和卸载后触发
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    },
    [],
  )

  return debouncedFn
}

/**
 * 防抖 Hook（带返回值）
 * 适用于需要获取返回值的异步函数
 * 返回一个对象：{ debouncedFn, cancel, isPending }
 */
export function useDebouncedCallback<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  delay: number,
) {
  const timerRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const [isPending, setIsPending] = useState(false)

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsPending(false)
  }, [])

  const debouncedFn = useCallback(
    (...args: TArgs): Promise<TReturn> =>
      new Promise((resolve, reject) => {
        // 清除之前的定时器
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current)
        }

        setIsPending(true)

        // 设置新的定时器
        timerRef.current = setTimeout(async () => {
          try {
            const result = await fn(...args)
            resolve(result)
          }
          catch (err) {
            reject(err)
          }
          finally {
            setIsPending(false)
            timerRef.current = null
          }
        }, delay)
      }),
    [fn, delay],
  )

  // 组件卸载时清除未执行的定时器
  useEffect(
    () => () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    },
    [],
  )

  return { cancel, debouncedFn, isPending }
}
