/**
 * 认证路由
 * 提供注册、登录、CSRF 防护、获取用户信息和修改密码的 API
 */

import type { Request, Response } from 'express'
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { changePassword, getProfile, login, register } from '../services/auth.js'
import { generateCsrfToken } from '../utils/csrf.js'
import { asyncHandler, httpError } from '../utils/http.js'
import { readRequiredString } from '../utils/validation.js'

const router: ReturnType<typeof Router> = Router()

// ========== 路由定义 ==========

/** 注册 */
router.post('/register', asyncHandler(async (req: Request, res: Response) => {
  const username = readRequiredString(req.body.username, '用户名', { min: 2, max: 20 })
  const password = readRequiredString(req.body.password, '密码', { min: 6, max: 72 })
  try {
    const result = await register(username, password)
    res.json({ success: true, ...result })
  }
  catch (err: unknown) {
    throw httpError(400, (err as Error).message)
  }
}))

/** 获取 CSRF token */
router.get('/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken()
  res.setHeader('X-CSRF-Token', token)
  res.cookie('csrf_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000,
  })
  res.json({ success: true, csrfToken: token })
})

/** 登录 */
router.post('/login', asyncHandler(async (req: Request, res: Response) => {
  const username = readRequiredString(req.body.username, '用户名', { min: 1, max: 20 })
  const password = readRequiredString(req.body.password, '密码', { min: 1, max: 72 })
  try {
    const result = await login(username, password)
    res.json({ success: true, ...result })
  }
  catch (err: unknown) {
    throw httpError(400, (err as Error).message)
  }
}))

/** 获取当前用户信息 */
router.get('/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as Request & { user: { id: string, username: string } }).user
  res.json({ success: true, user: { id: user.id, username: user.username } })
})

/** 获取个人资料（含 AI 额度和收藏） */
router.get('/profile', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  try {
    const user = (req as Request & { user: { id: string } }).user
    const profile = await getProfile(user.id)
    res.json({ success: true, profile })
  }
  catch (err: unknown) {
    throw httpError(400, (err as Error).message)
  }
}))

/** 修改密码 */
router.put('/password', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const currentPassword = readRequiredString(req.body.currentPassword, '当前密码', { min: 1, max: 72 })
  const newPassword = readRequiredString(req.body.newPassword, '新密码', { min: 6, max: 72 })
  try {
    const user = (req as Request & { user: { id: string } }).user
    await changePassword(user.id, currentPassword, newPassword)
    res.json({ success: true, message: '密码修改成功' })
  }
  catch (err: unknown) {
    throw httpError(400, (err as Error).message)
  }
}))

export default router
