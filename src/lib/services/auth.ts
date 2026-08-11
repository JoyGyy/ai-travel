/**
 * 认证服务
 * 提供用户注册、登录、JWT 验证功能
 * 使用 PostgreSQL 存储用户数据
 */
import bcrypt from 'bcryptjs'
import { eq, sql } from 'drizzle-orm'
import { jwtVerify, SignJWT } from 'jose'
import { nanoid } from 'nanoid'

import { aiUsage, userFavoriteAttractions, users } from '@/db/schema'

import { db } from '../db'
import { env } from '../env'

/** bcrypt 加盐轮数 */
const SALT_ROUNDS = 10
/** 每日 AI 调用上限 */
const DAILY_AI_LIMIT = 10

/** 获取 JWT 签名密钥 */
function getJwtKey(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET)
}

/** 签发 JWT（有效期 7 天） */
async function signJwt(payload: { id: string; username: string }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(getJwtKey())
}

/** 密码复杂度校验：至少 8 位，包含大小写字母和数字 */
function validatePassword(password: string): void {
  if (password.length < 8) throw new Error('密码长度至少 8 个字符')
  if (!/[a-z]/.test(password)) throw new Error('密码需包含小写字母')
  if (!/[A-Z]/.test(password)) throw new Error('密码需包含大写字母')
  if (!/[0-9]/.test(password)) throw new Error('密码需包含数字')
}

export interface AuthResult {
  token: string
  user: { id: string; username: string; createdAt: string }
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

/** 生成当天日期 key，格式 YYYY-MM-DD，用于 AI 配额按日统计 */
function getTodayKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** 用户注册：校验参数、密码哈希、写入数据库、签发 JWT */
async function register(username: string, password: string, email?: string): Promise<AuthResult> {
  if (!username || !password) throw new Error('用户名和密码不能为空')
  if (username.length < 2 || username.length > 20) throw new Error('用户名长度为 2-20 个字符')
  validatePassword(password)

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.username, username))
  if (existing.length > 0) throw new Error('用户名已存在')

  const hashed = await bcrypt.hash(password, SALT_ROUNDS)
  const id = nanoid()
  const createdAt = new Date().toISOString()
  const userEmail = email || `${username}@travel.local`

  await db.insert(users).values({
    id,
    username,
    email: userEmail,
    passwordHash: hashed,
    createdAt: new Date(createdAt),
  })

  const token = await signJwt({ id, username })
  return { token, user: { id, username, createdAt } }
}

/** 用户登录：验证用户名密码，签发 JWT（有效期 7 天） */
async function login(username: string, password: string): Promise<AuthResult> {
  if (!username || !password) throw new Error('用户名和密码不能为空')

  const result = await db
    .select({
      id: users.id,
      username: users.username,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.username, username))

  if (result.length === 0) throw new Error('用户名或密码错误')

  const user = result[0]
  const match = await bcrypt.compare(password, user.passwordHash)
  if (!match) throw new Error('用户名或密码错误')

  const token = await signJwt({ id: user.id, username: user.username })
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    },
  }
}

/** 验证 JWT token，无效时抛出异常 */
async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getJwtKey())
  return payload as unknown as JwtPayload
}

/** 从 Authorization header 或 cookie 提取并验证用户 */
export async function getAuthFromHeaders(headers: Headers): Promise<JwtPayload | null> {
  // 优先从 Authorization header
  const authHeader = headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    try {
      return await verifyToken(authHeader.slice(7))
    } catch {
      return null
    }
  }

  // 其次从 cookie
  const cookie = headers.get('cookie')
  if (cookie) {
    // 使用 \b 确保精确匹配 'token' cookie，不会误匹配 'csrf_token' 等
    const match = cookie.match(/\btoken=([^;]+)/)
    if (match) {
      try {
        return await verifyToken(match[1])
      } catch {
        return null
      }
    }
  }

  return null
}

/** 必需认证，失败返回 null */
export async function requireAuthFromHeaders(headers: Headers): Promise<JwtPayload> {
  const user = await getAuthFromHeaders(headers)
  if (!user) {
    throw new Error('未登录')
  }
  return user
}

/** 查询用户当日 AI 配额使用情况 */
async function getAiQuotaStatus(
  userId: string | undefined,
  date = getTodayKey(),
): Promise<AiQuotaStatus> {
  if (!userId) throw new Error('用户信息无效')

  const result = await db
    .select({ usedCount: aiUsage.usedCount })
    .from(aiUsage)
    .where(sql`${aiUsage.userId} = ${userId} AND ${aiUsage.usageDate} = ${date}`)

  const used = result.length > 0 ? result[0].usedCount : 0

  return {
    used,
    limit: DAILY_AI_LIMIT,
    remaining: Math.max(DAILY_AI_LIMIT - used, 0),
  }
}

/** 消耗一次 AI 配额（单条 SQL UPSERT + RETURNING），超限抛出 429 错误 */
async function consumeAiQuota(userId: string, date = getTodayKey()): Promise<AiQuotaStatus> {
  if (!userId) throw new Error('用户信息无效')

  const updatedAt = new Date().toISOString()

  // 单条 SQL：原子递增并返回结果，避免先 SELECT 再 INSERT 的两次往返
  const result = await db.execute<{ used_count: number }>(sql`
    INSERT INTO ai_usage (user_id, usage_date, used_count, updated_at)
    VALUES (${userId}, ${date}, 1, ${updatedAt})
    ON CONFLICT(user_id, usage_date)
    DO UPDATE SET used_count = ai_usage.used_count + 1, updated_at = ${updatedAt}
    WHERE ai_usage.used_count < ${DAILY_AI_LIMIT}
    RETURNING used_count
  `)

  // RETURNING 为空说明 WHERE 条件不满足（已达上限）
  if (result.rows.length === 0) {
    const currentQuota = await getAiQuotaStatus(userId, date)
    const err = new Error('今日 AI 使用次数已达上限，请明天再试') as Error & {
      status: number
      quota: AiQuotaStatus
    }
    err.status = 429
    err.quota = currentQuota
    throw err
  }

  const used = result.rows[0].used_count as number
  return {
    used,
    limit: DAILY_AI_LIMIT,
    remaining: DAILY_AI_LIMIT - used,
  }
}

async function listFavoriteAttractionIds(userId: string): Promise<string[]> {
  if (!userId) throw new Error('用户信息无效')

  const result = await db
    .select({ attractionId: userFavoriteAttractions.attractionId })
    .from(userFavoriteAttractions)
    .where(eq(userFavoriteAttractions.userId, userId))
    .orderBy(sql`${userFavoriteAttractions.createdAt} DESC`)

  return result.map((row) => row.attractionId)
}

async function addFavoriteAttraction(userId: string, attractionId: string): Promise<void> {
  if (!userId) throw new Error('用户信息无效')
  if (!attractionId) throw new Error('景点信息无效')

  await db.insert(userFavoriteAttractions).values({ userId, attractionId }).onConflictDoNothing()
}

async function removeFavoriteAttraction(userId: string, attractionId: string): Promise<void> {
  if (!userId) throw new Error('用户信息无效')
  if (!attractionId) throw new Error('景点信息无效')

  await db
    .delete(userFavoriteAttractions)
    .where(
      sql`${userFavoriteAttractions.userId} = ${userId} AND ${userFavoriteAttractions.attractionId} = ${attractionId}`,
    )
}

async function getProfile(userId: string): Promise<UserProfile> {
  if (!userId) throw new Error('用户信息无效')

  const result = await db
    .select({ id: users.id, username: users.username, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, userId))

  if (result.length === 0) throw new Error('用户不存在')

  const user = result[0]
  const aiQuota = await getAiQuotaStatus(userId)
  const favoriteIds = await listFavoriteAttractionIds(userId)

  return {
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    aiQuota,
    favoriteIds,
  }
}

async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  if (!userId) throw new Error('用户信息无效')
  if (!currentPassword || !newPassword) throw new Error('当前密码和新密码不能为空')
  validatePassword(newPassword)

  const result = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId))

  if (result.length === 0) throw new Error('用户不存在')

  const match = await bcrypt.compare(currentPassword, result[0].passwordHash)
  if (!match) throw new Error('当前密码错误')

  const newHashed = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await db.update(users).set({ passwordHash: newHashed }).where(eq(users.id, userId))
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
