/**
 * 认证路由
 * 提供注册、登录、获取当前用户信息的 API
 */

import { Router } from 'express'
import { login, register, verifyToken } from '../services/auth.js'

const router = Router()

/** 注册 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await register(username, password)
    res.json({ success: true, ...result })
  }
  catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

/** 登录 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    const result = await login(username, password)
    res.json({ success: true, ...result })
  }
  catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
})

/** 获取当前用户信息 */
router.get('/me', (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: '未登录' })
    }
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    res.json({ success: true, user: { id: payload.id, username: payload.username } })
  }
  catch {
    res.status(401).json({ success: false, message: '令牌无效或已过期' })
  }
})

export default router
