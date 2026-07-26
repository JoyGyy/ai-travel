/**
 * SSE (Server-Sent Events) 流式请求 Hook
 *
 * 封装 fetch + ReadableStream 实现自定义 SSE 解析，
 * 支持 chunk / step / notice / complete / error 五种事件类型，
 * 内置请求竞态控制（旧请求自动 abort）和类型守卫校验。
 */
import type { SSECallbacks, SSEEvent } from '@/types/api'

import { useCallback, useRef } from 'react'

import { getAuthHeader } from '@/api/client'

// --- 合法事件类型集合 ---
const SSE_EVENT_TYPES = new Set(['chunk', 'step', 'notice', 'complete', 'error'])

// --- 运行时类型守卫：校验 JSON 解析结果是否为合法的 SSE 事件 ---
function isSSEEvent(data: unknown): data is SSEEvent {
  if (typeof data !== 'object' || data === null)
    return false
  const obj = data as Record<string, unknown>
  return typeof obj.type === 'string' && SSE_EVENT_TYPES.has(obj.type)
}

export function useSSE() {
  // --- 请求竞态控制：通过 requestId 保证只有最新请求的回调生效 ---
  const abortControllerRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)

  const sendRequest = useCallback(async (url: string, body: object, callbacks: SSECallbacks = {}) => {
    abortControllerRef.current?.abort()

    const requestId = requestIdRef.current + 1
    requestIdRef.current = requestId

    const controller = new AbortController()
    abortControllerRef.current = controller

    const isCurrentRequest = () => requestIdRef.current === requestId && !controller.signal.aborted

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        let msg = `请求失败: HTTP ${res.status}`
        try {
          const errData = await res.json()
          msg = errData.message || errData.error || msg
        }
        catch {
          // 错误响应不是 JSON 时，保留默认 HTTP 错误信息
        }
        throw new Error(msg)
      }

      if (!res.body)
        throw new Error('响应体为空')

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let full = ''
      let remainder = ''

      async function handleLine(line: string) {
        if (!line.startsWith('data: ') || !isCurrentRequest())
          return

        let raw: unknown
        try {
          raw = JSON.parse(line.slice(6))
        }
        catch {
          throw new Error('服务端返回了无法解析的流式数据')
        }

        if (!isSSEEvent(raw))
          return

        if (raw.type === 'error')
          throw new Error(raw.message || '流式请求失败')
        if (raw.type === 'chunk' && callbacks.onChunk) {
          full += raw.content || ''
          callbacks.onChunk(full)
        }
        if (raw.type === 'step' && callbacks.onStep)
          callbacks.onStep(raw)
        if (raw.type === 'notice' && callbacks.onNotice)
          callbacks.onNotice(raw.message)
        if (raw.type === 'complete' && callbacks.onComplete)
          callbacks.onComplete(raw.data)
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          remainder += decoder.decode()
          break
        }

        const chunk = remainder + decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        remainder = lines.pop() || ''

        for (const line of lines) {
          await handleLine(line)
        }
      }

      if (remainder.trim())
        await handleLine(remainder)
    }
    catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err))
      if (error.name !== 'AbortError' && isCurrentRequest()) {
        callbacks.onError?.(error)
        throw error
      }
    }
    finally {
      if (isCurrentRequest()) {
        abortControllerRef.current = null
        callbacks.onFinally?.()
      }
    }
  }, [])

  // --- 手动中止当前请求，递增 requestId 使旧回调失效 ---
  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    requestIdRef.current += 1
  }, [])

  return { sendRequest, abort }
}
