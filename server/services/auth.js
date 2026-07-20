/**
 * 认证服务
 * 提供用户注册、登录、JWT 验证功能
 * 使用 SQLite (sql.js WASM) 存储用户数据
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import initSqlJs from 'sql.js'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const SALT_ROUNDS = 10
const DAILY_AI_LIMIT = 10

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 初始化 SQLite 数据库（WASM，无需原生编译）
const DB_PATH = path.join(import.meta.dirname, '../data/users.db')
const DB_DIR = path.dirname(DB_PATH)

let db = null
let saveDb = null
let initError = null

const ready = (async () => {
  await mkdir(DB_DIR, { recursive: true })

  // locateFile 确保 pnpm 软链接下能正确找到 WASM 文件
  const SQL = await initSqlJs({
    locateFile: file => path.join(import.meta.dirname, '../node_modules/sql.js/dist', file),
  })

  try {
    const buffer = await readFile(DB_PATH)
    db = new SQL.Database(new Uint8Array(buffer))
  }
  catch {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ai_usage (
      user_id TEXT NOT NULL,
      usage_date TEXT NOT NULL,
      used_count INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL,
      PRIMARY KEY (user_id, usage_date)
    );

    CREATE TABLE IF NOT EXISTS user_favorite_attractions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      attraction_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, attraction_id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `)

  saveDb = async () => {
    const data = db.export()
    await writeFile(DB_PATH, Buffer.from(data))
  }
  await saveDb()
})().catch((err) => {
  console.error('[auth] 数据库初始化失败:', err.message)
  initError = err
})

/**
 * 注册新用户
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{ token: string, user: { id: string, username: string, createdAt: string } }>}
 */
async function register(username, password) {
  await ready
  if (initError) throw new Error('数据库初始化失败，请稍后重试')

  if (!username || !password)
    throw new Error('用户名和密码不能为空')
  if (username.length < 2 || username.length > 20)
    throw new Error('用户名长度为 2-20 个字符')
  if (password.length < 6)
    throw new Error('密码长度至少 6 个字符')

  const existing = db.exec('SELECT id FROM users WHERE username = ?', [username])
  if (existing.length > 0 && existing[0].values.length > 0)
    throw new Error('用户名已存在')

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const createdAt = new Date().toISOString()

  db.run('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)', [id, username, hashed, createdAt])
  await saveDb()

  const token = jwt.sign({ id, username }, env.JWT_SECRET, { expiresIn: '7d' })
  return { token, user: { id, username, createdAt } }
}

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{ token: string, user: { id: string, username: string, createdAt: string } }>}
 */
async function login(username, password) {
  await ready
  if (initError) throw new Error('数据库初始化失败，请稍后重试')

  if (!username || !password)
    throw new Error('用户名和密码不能为空')

  const result = db.exec('SELECT id, username, password, created_at FROM users WHERE username = ?', [username])
  if (result.length === 0 || result[0].values.length === 0)
    throw new Error('用户名或密码错误')

  const [id, uname, hashedPassword, createdAt] = result[0].values[0]
  const match = await bcrypt.compare(password, hashedPassword)
  if (!match)
    throw new Error('用户名或密码错误')

  const token = jwt.sign({ id, username: uname }, env.JWT_SECRET, { expiresIn: '7d' })
  return { token, user: { id, username: uname, createdAt } }
}

/**
 * 验证 JWT 令牌
 * @param {string} token - JWT 令牌
 * @returns {{ id: string, username: string }}
 */
function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET)
}

/**
 * 查询用户当日 AI 使用额度状态
 * @param {string} userId - 用户 ID
 * @param {string} [date] - 日期字符串，默认今天
 * @returns {Promise<{ used: number, limit: number, remaining: number }>}
 */
async function getAiQuotaStatus(userId, date = getTodayKey()) {
  await ready
  if (initError) throw new Error('数据库初始化失败，请稍后重试')
  if (!userId) throw new Error('用户信息无效')

  const result = db.exec('SELECT used_count FROM ai_usage WHERE user_id = ? AND usage_date = ?', [userId, date])
  const used = result.length > 0 && result[0].values.length > 0
    ? Number(result[0].values[0][0])
    : 0

  return {
    used,
    limit: DAILY_AI_LIMIT,
    remaining: Math.max(DAILY_AI_LIMIT - used, 0),
  }
}

/**
 * 消耗一次 AI 使用额度
 * @param {string} userId - 用户 ID
 * @param {string} [date] - 日期字符串，默认今天
 * @returns {Promise<{ used: number, limit: number, remaining: number }>}
 */
async function consumeAiQuota(userId, date = getTodayKey()) {
  const currentQuota = await getAiQuotaStatus(userId, date)

  if (currentQuota.remaining <= 0) {
    const err = new Error('今日 AI 使用次数已达上限，请明天再试')
    err.status = 429
    err.quota = currentQuota
    throw err
  }

  const next = currentQuota.used + 1
  const updatedAt = new Date().toISOString()

  db.run(
    `INSERT INTO ai_usage (user_id, usage_date, used_count, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id, usage_date)
     DO UPDATE SET used_count = excluded.used_count, updated_at = excluded.updated_at`,
    [userId, date, next, updatedAt],
  )
  await saveDb()

  return {
    used: next,
    limit: DAILY_AI_LIMIT,
    remaining: DAILY_AI_LIMIT - next,
  }
}

/**
 * 列出用户收藏的景点 ID 列表
 * @param {string} userId - 用户 ID
 * @returns {Promise<string[]>} 收藏的景点 ID 数组，按收藏时间倒序
 */
async function listFavoriteAttractionIds(userId) {
  await ready
  if (!userId) throw new Error('用户信息无效')

  const result = db.exec(
    'SELECT attraction_id FROM user_favorite_attractions WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
  )

  if (result.length === 0) return []
  return result[0].values.map(row => row[0])
}

/**
 * 添加用户收藏景点（幂等，重复添加不报错）
 * @param {string} userId - 用户 ID
 * @param {string} attractionId - 景点 ID
 * @returns {Promise<void>}
 */
async function addFavoriteAttraction(userId, attractionId) {
  await ready
  if (!userId) throw new Error('用户信息无效')
  if (!attractionId) throw new Error('景点信息无效')

  const id = `${userId}:${attractionId}`
  const createdAt = new Date().toISOString()
  db.run(
    `INSERT OR IGNORE INTO user_favorite_attractions (id, user_id, attraction_id, created_at)
     VALUES (?, ?, ?, ?)`,
    [id, userId, attractionId, createdAt],
  )
  await saveDb()
}

/**
 * 移除用户收藏景点（幂等，重复移除不报错）
 * @param {string} userId - 用户 ID
 * @param {string} attractionId - 景点 ID
 * @returns {Promise<void>}
 */
async function removeFavoriteAttraction(userId, attractionId) {
  await ready
  if (!userId) throw new Error('用户信息无效')
  if (!attractionId) throw new Error('景点信息无效')

  db.run(
    'DELETE FROM user_favorite_attractions WHERE user_id = ? AND attraction_id = ?',
    [userId, attractionId],
  )
  await saveDb()
}

/**
 * 获取用户个人资料（含 AI 额度和收藏列表）
 * @param {string} userId - 用户 ID
 * @returns {Promise<{ id: string, username: string, createdAt: string, aiQuota: { used: number, limit: number, remaining: number }, favoriteIds: string[] }>}
 */
async function getProfile(userId) {
  await ready
  if (initError) throw new Error('数据库初始化失败，请稍后重试')
  if (!userId) throw new Error('用户信息无效')

  const result = db.exec('SELECT id, username, created_at FROM users WHERE id = ?', [userId])
  if (result.length === 0 || result[0].values.length === 0)
    throw new Error('用户不存在')

  const [id, username, createdAt] = result[0].values[0]
  const aiQuota = await getAiQuotaStatus(userId)
  const favoriteIds = await listFavoriteAttractionIds(userId)

  return { id, username, createdAt, aiQuota, favoriteIds }
}

/**
 * 修改用户密码
 * @param {string} userId - 用户 ID
 * @param {string} currentPassword - 当前密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword) {
  await ready
  if (initError) throw new Error('数据库初始化失败，请稍后重试')
  if (!userId) throw new Error('用户信息无效')
  if (!currentPassword || !newPassword)
    throw new Error('当前密码和新密码不能为空')
  if (newPassword.length < 6)
    throw new Error('新密码长度至少 6 个字符')

  const result = db.exec('SELECT password FROM users WHERE id = ?', [userId])
  if (result.length === 0 || result[0].values.length === 0)
    throw new Error('用户不存在')

  const [hashedPassword] = result[0].values[0]
  const match = await bcrypt.compare(currentPassword, hashedPassword)
  if (!match)
    throw new Error('当前密码错误')

  const newHashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
  db.run('UPDATE users SET password = ? WHERE id = ?', [newHashed, userId])
  await saveDb()
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
