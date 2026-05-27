/**
 * SSE (Server-Sent Events) 自定义 Hook
 * 用于处理流式 HTTP 响应，实现 AI 回复的实时流式显示
 */
import { useCallback, useRef } from 'react'

/** SSE 回调函数接口 */
interface SSECallbacks {
  onChunk?: (content: string) => void    // 收到新的数据块时触发，content 是累积的完整内容
  onComplete?: (data: unknown) => void   // 流式传输完成时触发
  onStep?: (step: unknown) => void       // 收到 Agent 步骤更新时触发
  onError?: (error: Error) => void       // 发生错误时触发
  onFinally?: () => void                 // 无论成功失败都会触发，用于清理状态
}

/**
 * SSE Hook
 * 提供发送流式请求和中止请求的能力
 * @returns sendRequest - 发送 SSE 请求的函数
 * @returns abort - 中止当前请求的函数
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
    body: Record<string, unknown>, // 使用 unknown 替代 any，更类型安全
    callbacks: SSECallbacks,
  ) => {
    // 创建新的 AbortController 用于中止请求
    abortControllerRef.current = new AbortController()

    try {
      // 发送 POST 请求
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: abortControllerRef.current.signal, // 绑定中止信号
      })

      // 获取响应流的读取器
      const reader = res.body!.getReader()
      const decoder = new TextDecoder() // 用于将二进制数据解码为文本
      let full = '' // 累积的完整内容

      // 循环读取流数据
      while (true) {
        const { done, value } = await reader.read()
        if (done) break // 流结束

        // 将二进制数据解码为文本
        const chunk = decoder.decode(value)
        // 按行分割（SSE 协议以换行分隔消息）
        const lines = chunk.split('\n')

        for (const line of lines) {
          // SSE 数据以 "data: " 开头
          if (line.startsWith('data: ')) {
            try {
              // 解析 JSON 数据
              const data = JSON.parse(line.slice(6))

              // 处理不同类型的消息
              if (data.type === 'chunk' && callbacks.onChunk) {
                full += data.content // 累积内容
                callbacks.onChunk(full) // 传递累积的完整内容
              }
              if (data.type === 'step' && callbacks.onStep) {
                callbacks.onStep(data) // 传递 Agent 步骤更新
              }
              if (data.type === 'complete' && callbacks.onComplete) {
                callbacks.onComplete(data.data) // 传递最终结果
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
      // 无论成功失败都调用 onFinally 回调
      callbacks.onFinally?.()
    }
  }, []) // 空依赖数组，函数引用保持稳定

  /**
   * 中止当前请求
   * 调用 AbortController 的 abort 方法取消正在进行的请求
   */
  const abort = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { sendRequest, abort }
}
