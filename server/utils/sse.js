/**
 * SSE (Server-Sent Events) 工具函数
 * 用于向客户端推送流式数据
 */

/**
 * 初始化 SSE 响应头
 * @param {import('express').Response} res - Express 响应对象
 */
function initSSE(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  })
}

/**
 * 发送 SSE 数据
 * @param {import('express').Response} res - Express 响应对象
 * @param {object} data - 要发送的数据对象
 */
function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

/**
 * 发送错误消息
 * @param {import('express').Response} res - Express 响应对象
 * @param {string} message - 错误信息
 */
function sendError(res, message) {
  sendSSE(res, { type: 'error', message })
}

module.exports = { initSSE, sendSSE, sendError }
