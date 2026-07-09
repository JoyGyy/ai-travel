/**
 * Express 后端服务入口
 * 提供旅行推荐和 AI 对话的 API 接口
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'

import travelRoutes from './routes/travel.js'
import chatRoutes from './routes/chat.js'
import weatherRoutes from './routes/weather.js'
import authRoutes from './routes/auth.js'
import shareRoutes from './routes/share.js'
import { createRateLimit } from './middleware/rateLimit.js'
import { env, getLLMProviders } from './config/env.js'

const app = express()
const PORT = env.PORT

// 安全响应头
app.use(helmet())

// CORS 配置：仅允许配置中的前端域名跨域请求
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.CORS_ORIGINS.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new Error('不允许的跨域来源'))
  },
  credentials: true,
}))

// JSON 请求体解析
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }))

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
  next()
})

// 限流：AI 接口每分钟最多 15 次
const aiLimiter = createRateLimit({ name: 'ai', windowMs: 60_000, maxRequests: 15, message: 'AI 请求过于频繁，请稍后再试' })
// 限流：认证接口每分钟最多 10 次（防暴力破解）
const authLimiter = createRateLimit({ name: 'auth', windowMs: 60_000, maxRequests: 10, message: '登录请求过于频繁，请稍后再试' })

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
app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err)
    return
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({ success: false, message: '请求数据过大' })
    return
  }

  if (err.message === '不允许的跨域来源') {
    res.status(403).json({ success: false, message: err.message })
    return
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: '令牌无效或已过期' })
    return
  }

  console.error('服务器错误:', err)
  res.status(500).json({ error: '服务器内部错误' })
})

// 启动服务
app.listen(PORT, () => {
  const providers = getLLMProviders().map(provider => provider.name).join(' / ') || 'Mock/知识库降级模式'
  console.log(`\n  🚀 旅行助手后端服务已启动`)
  console.log(`  📡 地址: http://localhost:${PORT}`)
  console.log(`  🤖 LLM: ${providers}`)
  console.log(`  📋 接口:`)
  console.log(`     POST /api/travel/recommend - 行程推荐`)
  console.log(`     POST /api/travel/chat      - AI 对话`)
  console.log(`     GET  /api/health            - 健康检查\n`)
})
