/**
 * SSE (Server-Sent Events) 自定义 Hook
 * 用于处理流式 HTTP 响应，实现 AI 回复的实时流式显示
 */
import { useCallback, useRef } from 'react'

export function useSSE() {
  const abortControllerRef = useRef(null)

  const sendRequest = useCallback(async (url, body, callbacks) => {
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok) {
        let msg = `请求失败: HTTP ${res.status}`
        try {
          const errData = await res.json()
          if (errData.message) msg = errData.message
        } catch {}
        throw new Error(msg)
      }

      if (!res.body) throw new Error('响应体为空')

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let full = ''
      let remainder = ''

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
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk' && callbacks.onChunk) {
                full += data.content
                callbacks.onChunk(full)
              }
              if (data.type === 'step' && callbacks.onStep) callbacks.onStep(data)
              if (data.type === 'notice' && callbacks.onNotice) callbacks.onNotice(data.message)
              if (data.type === 'complete' && callbacks.onComplete) callbacks.onComplete(data.data)
            } catch {
              // SSE 解析错误，忽略
            }
          }
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError' && callbacks.onError) callbacks.onError(e)
    } finally {
      callbacks.onFinally?.()
    }
  }, [])

  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { sendRequest, abort }
}
