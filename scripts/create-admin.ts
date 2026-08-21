/**
 * 创建管理员账户脚本
 *
 * 环境变量：
 *   ADMIN_USERNAME — 管理员用户名（默认 joygy）
 *   ADMIN_PASSWORD — 管理员密码（必须设置）
 *   ADMIN_EMAIL    — 管理员邮箱（默认 {username}@travel.local）
 *
 * 运行方式：ADMIN_PASSWORD=xxx npx tsx scripts/create-admin.ts
 */
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { nanoid } from 'nanoid'

import { query } from '../src/lib/db'

const SALT_ROUNDS = 10

async function createAdmin() {
  const username = process.env.ADMIN_USERNAME || 'joygy'
  const password = process.env.ADMIN_PASSWORD
  const email = process.env.ADMIN_EMAIL || `${username}@travel.local`

  if (!password) {
    console.error('错误：请设置 ADMIN_PASSWORD 环境变量')
    console.error('用法：ADMIN_PASSWORD=你的密码 npx tsx scripts/create-admin.ts')
    process.exit(1)
  }

  // 检查是否已存在
  const existing = await query('SELECT id, role FROM users WHERE username = $1', [username])
  if (existing.rows.length > 0) {
    const user = existing.rows[0]
    if (user.role === 'admin') {
      console.log(`管理员账户 "${username}" 已存在（id: ${user.id}），无需重复创建`)
    }
    else {
      // 升级为管理员
      await query('UPDATE users SET role = $1 WHERE id = $2', ['admin', user.id])
      console.log(`用户 "${username}" 已升级为管理员（id: ${user.id}）`)
    }
    return
  }

  // 创建新管理员
  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const id = nanoid()

  await query(
    'INSERT INTO users (id, username, password_hash, email, role, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, username, hashed, email, 'admin', new Date()],
  )

  console.log(`管理员账户创建成功！`)
  console.log(`  用户名: ${username}`)
  console.log(`  角色: admin`)
  console.log(`  ID: ${id}`)
}

createAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('创建管理员失败:', err.message)
    process.exit(1)
  })
