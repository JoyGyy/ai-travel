/**
 * 认证路由
 * 提供注册、登录、获取当前用户信息的 API
 */

import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { login, register } from '../services/auth.js'
import { asyncHandler, httpError } from '../utils/http.js'
import { readRequiredString } from '../utils/validation.js'

const router = Router()

/** 注册 */
router.post('/register', asyncHandler(async (req, res) => {
  const username = readRequiredString(req.body.username, '用户名', { min: 2, max: 20 })
  const password = readRequiredString(req.body.password, '密码', { min: 6, max: 72 })
  try {
    const result = await register(username, password)
    res.json({ success: true, ...result })
  }
  catch (err) {
    throw httpError(400, err.message)
  }
}))

/** 登录 */
router.post('/login', asyncHandler(async (req, res) => {
  const username = readRequiredString(req.body.username, '用户名', { min: 1, max: 20 })
  const password = readRequiredString(req.body.password, '密码', { min: 1, max: 72 })
  try {
    const result = await login(username, password)
    res.json({ success: true, ...result })
  }
  catch (err) {
    throw httpError(400, err.message)
  }
}))

/** 获取当前用户信息 */
router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: { id: req.user.id, username: req.user.username } })
})

export default router
