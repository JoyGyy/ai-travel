/**
 * SSE (Server-Sent Events) 工具函数
 * 用于向客户端推送流式数据
 */
import type { Response } from 'express'

interface SSEData {
  type: string
  [key: string]: unknown
}

function initSSE(res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
}

function sendSSE(res: Response, data: SSEData): void {
  if (res.destroyed || !res.writable)
    return
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
  catch {
    // 写入失败（客户端已断开），忽略
  }
}

function sendError(res: Response, message: string): void {
  sendSSE(res, { type: 'error', message })
}

export { initSSE, sendError, sendSSE }
