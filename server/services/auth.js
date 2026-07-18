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
    )
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

export { login, register, verifyToken }
