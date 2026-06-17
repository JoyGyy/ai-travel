/**
 * Express 后端服务入口
 * 提供旅行推荐和 AI 对话的 API 接口
 */

import path from 'node:path'
import { config } from 'dotenv'
import express from 'express'
import cors from 'cors'

import travelRoutes from './routes/travel.js'
import chatRoutes from './routes/chat.js'
import weatherRoutes from './routes/weather.js'
import authRoutes from './routes/auth.js'
import shareRoutes from './routes/share.js'
import { createRateLimit } from './middleware/rateLimit.js'

config({ path: path.resolve(import.meta.dirname, '../.env') })

const app = express()
const PORT = process.env.PORT || 3030

// CORS 配置：仅允许前端域名跨域请求
app.use(cors({
  origin: ['http://localhost:5181', 'http://localhost:3000'],
  credentials: true,
}))

// JSON 请求体解析
app.use(express.json())

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
  next()
})

// 限流：AI 接口每分钟最多 15 次
const aiLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 15, message: 'AI 请求过于频繁，请稍后再试' })
// 限流：认证接口每分钟最多 10 次（防暴力破解）
const authLimiter = createRateLimit({ windowMs: 60_000, maxRequests: 10, message: '登录请求过于频繁，请稍后再试' })

// 挂载路由
app.use('/api/travel', aiLimiter, travelRoutes)
app.use('/api/travel', aiLimiter, chatRoutes)
app.use('/api', weatherRoutes)
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/travel', shareRoutes)

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' })
})

// 全局错误处理中间件
app.use((err, req, res, _next) => {
  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务
app.listen(PORT, () => {
  console.log(`\n  🚀 旅行助手后端服务已启动`)
  console.log(`  📡 地址: http://localhost:${PORT}`)
  console.log(`  📋 接口:`)
  console.log(`     POST /api/travel/recommend - 行程推荐`)
  console.log(`     POST /api/travel/chat      - AI 对话`)
  console.log(`     GET  /api/health            - 健康检查\n`)
})
