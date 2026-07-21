/**
 * Express 后端服务入口
 * 提供旅行推荐和 AI 对话的 API 接口
 */

import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env, getLLMProviders } from './config/env.js'
import { createRateLimit } from './middleware/rateLimit.js'
import adminAttractionRoutes from './routes/admin/attractions.js'
import attractionRoutes from './routes/attractions.js'
import authRoutes from './routes/auth.js'
import chatRoutes from './routes/chat.js'
import shareRoutes from './routes/share.js'
import travelRoutes from './routes/travel.js'
import weatherRoutes from './routes/weather.js'
import { errorHandler, notFoundHandler } from './utils/http.js'
import { createLogger } from './utils/logger.js'

const log = createLogger('server')

const app = express()
const PORT = env.PORT

// 安全响应头
app.use(helmet())

// CORS 配置：仅允许配置中的前端域名跨域请求
app.use(cors({
  origin(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
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
app.use((req, _res, next) => {
  log.debug(`${req.method} ${req.url}`)
  next()
})

// 限流：AI 接口每分钟最多 15 次
const aiLimiter = createRateLimit({ name: 'ai', windowMs: 60_000, maxRequests: 15, message: 'AI 请求过于频繁，请稍后再试' })
// 限流：认证接口每分钟最多 10 次（防暴力破解）
const authLimiter = createRateLimit({ name: 'auth', windowMs: 60_000, maxRequests: 10, message: '登录请求过于频繁，请稍后再试' })
// 限流：注册接口每小时最多 5 次（降低批量注册风险）
const registerLimiter = createRateLimit({ name: 'register', windowMs: 60 * 60_000, maxRequests: 5, message: '注册过于频繁，请稍后再试' })

// 挂载路由
app.use('/api/travel/recommend', aiLimiter)
app.use('/api/travel/chat', aiLimiter)
app.use('/api/travel', travelRoutes)
app.use('/api/travel', chatRoutes)
app.use('/api/attractions', attractionRoutes)
app.use('/api/admin/attractions', adminAttractionRoutes)
app.use('/api/travel', shareRoutes)
app.use('/api', weatherRoutes)
app.use('/api/auth/register', registerLimiter)
app.use('/api/auth', authLimiter, authRoutes)

// 健康检查接口
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 与全局错误处理
app.use(notFoundHandler)
app.use(errorHandler)

// 启动服务
app.listen(PORT, () => {
  const providers = getLLMProviders().map(provider => provider.name).join(' / ') || 'Mock/知识库降级模式'
  log.info(`服务已启动 — http://localhost:${PORT}`)
  log.info(`LLM: ${providers}`)
  log.info('接口: POST /api/travel/recommend | POST /api/travel/chat | GET /api/attractions | GET /api/health')
})
