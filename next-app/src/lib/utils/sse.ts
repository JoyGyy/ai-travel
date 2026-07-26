/**
 * SSE (Server-Sent Events) 工具函数
 * 基于 Web Streams API，适配 Next.js Route Handlers
 */

export interface SSEData {
  type: string
  [key: string]: unknown
}

/**
 * 创建 SSE 流式响应
 * @param handler 处理函数，通过 send 向客户端推送数据
 */
export function createSSEStream(
  handler: (send: (data: SSEData) => void) => Promise<void>,
): Response {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: SSEData) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        }
        catch {
          // 流已关闭，忽略
        }
      }

      try {
        await handler(send)
      }
      catch (err) {
        const message = err instanceof Error ? err.message : '未知错误'
        send({ type: 'error', message })
      }
      finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

/** 发送错误事件 */
export function sendError(send: (data: SSEData) => void, message: string): void {
  send({ type: 'error', message })
}
