/**
 * Express 后端服务入口
 * 提供旅行推荐和 AI 对话的 API 接口
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') })

const express = require('express')
const cors = require('cors')

const travelRoutes = require('./routes/travel')
const chatRoutes = require('./routes/chat')

const app = express()
const PORT = process.env.PORT || 3030

// CORS 配置：允许前端跨域请求
app.use(cors({
  origin: true,
  credentials: true,
}))

// JSON 请求体解析
app.use(express.json())

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`)
  next()
})

// 挂载路由
app.use('/api/travel', travelRoutes)
app.use('/api/travel', chatRoutes)

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
