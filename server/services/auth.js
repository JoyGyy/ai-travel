/**
 * 认证服务
 * 提供用户注册、登录、JWT 验证功能
 * 使用 SQLite 存储用户数据
 */

import path from 'node:path'
import bcrypt from 'bcryptjs'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const SALT_ROUNDS = 10

// 初始化 SQLite 数据库
const DB_PATH = process.env.USERS_DB_PATH
  ? path.resolve(process.env.USERS_DB_PATH)
  : path.join(import.meta.dirname, '../data/users.db')
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
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

const insertUser = db.prepare('INSERT INTO users (id, username, password, created_at) VALUES (?, ?, ?, ?)')
const findUserByName = db.prepare('SELECT * FROM users WHERE username = ?')

/**
 * 注册新用户
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<{ token: string, user: { id: string, username: string, createdAt: string } }>}
 */
async function register(username, password) {
  if (!username || !password)
    throw new Error('用户名和密码不能为空')
  if (username.length < 2 || username.length > 20)
    throw new Error('用户名长度为 2-20 个字符')
  if (password.length < 6)
    throw new Error('密码长度至少 6 个字符')

  const existing = findUserByName.get(username)
  if (existing)
    throw new Error('用户名已存在')

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  const createdAt = new Date().toISOString()

  insertUser.run(id, username, hashed, createdAt)

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
  if (!username || !password)
    throw new Error('用户名和密码不能为空')

  const user = findUserByName.get(username)
  if (!user)
    throw new Error('用户名或密码错误')

  const match = await bcrypt.compare(password, user.password)
  if (!match)
    throw new Error('用户名或密码错误')

  const token = jwt.sign({ id: user.id, username: user.username }, env.JWT_SECRET, { expiresIn: '7d' })
  return { token, user: { id: user.id, username: user.username, createdAt: user.created_at } }
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
 * 列出用户收藏的景点 ID 列表
 * @param {string} userId - 用户 ID
 * @returns {Promise<string[]>} 收藏的景点 ID 数组，按收藏时间倒序
 */
async function listFavoriteAttractionIds(userId) {
  if (!userId) throw new Error('用户信息无效')

  const rows = db.prepare(
    'SELECT attraction_id FROM user_favorite_attractions WHERE user_id = ? ORDER BY created_at DESC',
  ).all(userId)

  return rows.map(row => row.attraction_id)
}

/**
 * 添加用户收藏景点（幂等，重复添加不报错）
 * @param {string} userId - 用户 ID
 * @param {string} attractionId - 景点 ID
 * @returns {Promise<void>}
 */
async function addFavoriteAttraction(userId, attractionId) {
  if (!userId) throw new Error('用户信息无效')
  if (!attractionId) throw new Error('景点信息无效')

  const id = `${userId}:${attractionId}`
  const createdAt = new Date().toISOString()
  db.prepare(
    `INSERT OR IGNORE INTO user_favorite_attractions (id, user_id, attraction_id, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, userId, attractionId, createdAt)
}

/**
 * 移除用户收藏景点（幂等，重复移除不报错）
 * @param {string} userId - 用户 ID
 * @param {string} attractionId - 景点 ID
 * @returns {Promise<void>}
 */
async function removeFavoriteAttraction(userId, attractionId) {
  if (!userId) throw new Error('用户信息无效')
  if (!attractionId) throw new Error('景点信息无效')

  db.prepare(
    'DELETE FROM user_favorite_attractions WHERE user_id = ? AND attraction_id = ?',
  ).run(userId, attractionId)
}

export {
  addFavoriteAttraction,
  listFavoriteAttractionIds,
  login,
  register,
  removeFavoriteAttraction,
  verifyToken,
}
