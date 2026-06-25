/**
 * SSE (Server-Sent Events) 自定义 Hook
 * 用于处理流式 HTTP 响应，实现 AI 回复的实时流式显示
 */
import { useCallback, useRef } from 'react'

/** SSE 回调函数接口 */
interface SSECallbacks {
  onChunk?: (content: string) => void // 收到新的数据块时触发，content 是累积的完整内容
  onComplete?: (data: unknown) => void // 流式传输完成时触发
  onStep?: (step: unknown) => void // 收到 Agent 步骤更新时触发
  onNotice?: (message: string) => void // 收到服务端提示信息时触发（如降级通知）
  onError?: (error: Error) => void // 发生错误时触发
  onFinally?: () => void // 无论成功失败都会触发，用于清理状态
}

/**
 * SSE Hook
 * 提供发送流式请求和中止请求的能力
 * @returns 返回包含发送请求和中止请求函数的对象：{ sendRequest, abort }
 */
export function useSSE() {
  // 使用 ref 保存 AbortController 实例，以便可以中止请求
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 发送 SSE 请求
   * @param url - 请求地址
   * @param body - 请求体数据
   * @param callbacks - 回调函数集合
   */
  const sendRequest = useCallback(async (
    url: string,
    body: Record<string, unknown>,
    callbacks: SSECallbacks,
  ) => {
    // 创建新的 AbortController 用于中止请求
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      // BUG FIX: 检查 HTTP 状态码，非 2xx 时抛错
      if (!res.ok) {
        let msg = `请求失败: HTTP ${res.status}`
        try {
          const errData = await res.json()
          if (errData.message)
            msg = errData.message
        }
        catch {}
        throw new Error(msg)
      }

      // BUG FIX: 检查 response body 是否存在
      if (!res.body) {
        throw new Error('响应体为空')
      }

      const reader = res.body.getReader()
      // BUG FIX: 使用 stream 模式防止多字节 UTF-8 字符（如中文）在 chunk 边界被截断损坏
      const decoder = new TextDecoder('utf-8')
      let full = ''
      let remainder = '' // 缓冲不完整的行

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          // 流结束时，用 stream: false 解码剩余字节
          remainder += decoder.decode()
          break
        }

        // 拼接上次剩余的不完整数据
        const chunk = remainder + decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        // 最后一个元素可能是不完整的行，保留到下次处理
        remainder = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'chunk' && callbacks.onChunk) {
                full += data.content
                callbacks.onChunk(full)
              }
              if (data.type === 'step' && callbacks.onStep) {
                callbacks.onStep(data)
              }
              if (data.type === 'notice' && callbacks.onNotice) {
                callbacks.onNotice(data.message)
              }
              if (data.type === 'complete' && callbacks.onComplete) {
                callbacks.onComplete(data.data)
              }
            }
            catch {
              // SSE 解析错误，忽略该行数据
            }
          }
        }
      }
    }
    catch (e: unknown) {
      // 处理请求错误，忽略中止错误（用户主动取消）
      if (e instanceof Error && e.name !== 'AbortError' && callbacks.onError) {
        callbacks.onError(e)
      }
    }
    finally {
      callbacks.onFinally?.()
    }
  }, [])

  /**
   * 中止当前请求
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { sendRequest, abort }
}
