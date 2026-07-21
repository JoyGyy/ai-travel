/**
 * 认证服务
 * 提供用户注册、登录、JWT 验证功能
 * 使用 PostgreSQL 存储用户数据
 */
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { query } from '../db/index.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('auth')

const SALT_ROUNDS = 10
const DAILY_AI_LIMIT = 10

export interface AuthResult {
  token: string
  user: { id: string, username: string, createdAt: string }
}

export interface AiQuotaStatus {
  used: number
  limit: number
  remaining: number
}

export interface UserProfile {
  id: string
  username: string
  createdAt: string
  aiQuota: AiQuotaStatus
  favoriteIds: string[]
}

export interface JwtPayload {
  id: string
  username: string
}

function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function register(username: string, password: string): Promise<AuthResult> {
  if (!username || !password)
    throw new Error('用户名和密码不能为空')
  if (username.length < 2 || username.length > 20)
    throw new Error('用户名长度为 2-20 个字符')
  if (password.length < 6)
    throw new Error('密码长度至少 6 个字符')

  const existing = await query('SELECT id FROM users WHERE username = $1', [username])
  if (existing.rows.length > 0)
    throw new Error('用户名已存在')

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const createdAt = new Date().toISOString()

  await query(
    'INSERT INTO users (id, username, password, created_at) VALUES ($1, $2, $3, $4)',
    [id, username, hashed, createdAt],
  )

  const token = jwt.sign({ id, username }, env.JWT_SECRET, { expiresIn: '7d' })
  return { token, user: { id, username, createdAt } }
}

async function login(username: string, password: string): Promise<AuthResult> {
  if (!username || !password)
    throw new Error('用户名和密码不能为空')

  const result = await query(
    'SELECT id, username, password, created_at FROM users WHERE username = $1',
    [username],
  )
  if (result.rows.length === 0)
    throw new Error('用户名或密码错误')

  const user = result.rows[0]
  const match = await bcrypt.compare(password, user.password)
  if (!match)
    throw new Error('用户名或密码错误')

  const token = jwt.sign({ id: user.id, username: user.username }, env.JWT_SECRET, { expiresIn: '7d' })
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.created_at,
    },
  }
}

function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload
}

async function getAiQuotaStatus(userId: string | undefined, date = getTodayKey()): Promise<AiQuotaStatus> {
  if (!userId)
    throw new Error('用户信息无效')

  const result = await query(
    'SELECT used_count FROM ai_usage WHERE user_id = $1 AND usage_date = $2',
    [userId, date],
  )
  const used = result.rows.length > 0 ? Number(result.rows[0].used_count) : 0

  return {
    used,
    limit: DAILY_AI_LIMIT,
    remaining: Math.max(DAILY_AI_LIMIT - used, 0),
  }
}

async function consumeAiQuota(userId: string | undefined, date = getTodayKey()): Promise<AiQuotaStatus> {
  const currentQuota = await getAiQuotaStatus(userId, date)

  if (currentQuota.remaining <= 0) {
    const err = new Error('今日 AI 使用次数已达上限，请明天再试') as Error & { status: number, quota: AiQuotaStatus }
    err.status = 429
    err.quota = currentQuota
    throw err
  }

  const next = currentQuota.used + 1
  const updatedAt = new Date().toISOString()

  await query(
    `INSERT INTO ai_usage (user_id, usage_date, used_count, updated_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT(user_id, usage_date)
     DO UPDATE SET used_count = $3, updated_at = $4`,
    [userId!, date, next, updatedAt],
  )

  return {
    used: next,
    limit: DAILY_AI_LIMIT,
    remaining: DAILY_AI_LIMIT - next,
  }
}

async function listFavoriteAttractionIds(userId: string): Promise<string[]> {
  if (!userId)
    throw new Error('用户信息无效')

  const result = await query(
    'SELECT attraction_id FROM user_favorite_attractions WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  )

  return result.rows.map(row => row.attraction_id as string)
}

async function addFavoriteAttraction(userId: string, attractionId: string): Promise<void> {
  if (!userId)
    throw new Error('用户信息无效')
  if (!attractionId)
    throw new Error('景点信息无效')

  await query(
    `INSERT INTO user_favorite_attractions (user_id, attraction_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id, attraction_id) DO NOTHING`,
    [userId, attractionId],
  )
}

async function removeFavoriteAttraction(userId: string, attractionId: string): Promise<void> {
  if (!userId)
    throw new Error('用户信息无效')
  if (!attractionId)
    throw new Error('景点信息无效')

  await query(
    'DELETE FROM user_favorite_attractions WHERE user_id = $1 AND attraction_id = $2',
    [userId, attractionId],
  )
}

async function getProfile(userId: string): Promise<UserProfile> {
  if (!userId)
    throw new Error('用户信息无效')

  const result = await query(
    'SELECT id, username, created_at FROM users WHERE id = $1',
    [userId],
  )
  if (result.rows.length === 0)
    throw new Error('用户不存在')

  const user = result.rows[0]
  const aiQuota = await getAiQuotaStatus(userId)
  const favoriteIds = await listFavoriteAttractionIds(userId)

  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
    aiQuota,
    favoriteIds,
  }
}

async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  if (!userId)
    throw new Error('用户信息无效')
  if (!currentPassword || !newPassword)
    throw new Error('当前密码和新密码不能为空')
  if (newPassword.length < 6)
    throw new Error('新密码长度至少 6 个字符')

  const result = await query('SELECT password FROM users WHERE id = $1', [userId])
  if (result.rows.length === 0)
    throw new Error('用户不存在')

  const match = await bcrypt.compare(currentPassword, result.rows[0].password)
  if (!match)
    throw new Error('当前密码错误')

  const newHashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await query('UPDATE users SET password = $1 WHERE id = $2', [newHashed, userId])
}

export {
  addFavoriteAttraction,
  changePassword,
  consumeAiQuota,
  getAiQuotaStatus,
  getProfile,
  listFavoriteAttractionIds,
  login,
  register,
  removeFavoriteAttraction,
  verifyToken,
}
