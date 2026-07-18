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
const DB_PATH = path.join(import.meta.dirname, '../data/users.db')
const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
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

export { login, register, verifyToken }
