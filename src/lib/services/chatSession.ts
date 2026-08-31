/**
 * AI 手账会话领域服务
 * 负责会话的 PostgreSQL 数据持久化与多用户隔离
 */
import { query, typedQuery } from '../db'
import { httpError } from '../utils/http'

export interface ChatSessionRecord {
  city: null | string
  createdAt: string
  id: string
  messages: unknown[]
  title: string
  updatedAt: string
  userId: string
}

export interface SaveChatSessionInput {
  city?: null | string
  createdAt?: number | string
  id: string
  messages: unknown[]
  title?: string
  updatedAt?: number | string
}

interface ChatSessionRow {
  city: null | string
  created_at: Date | string
  id: string
  messages: unknown
  title: string
  updated_at: Date | string
  user_id: string
}

function toIsoString(value: Date | string | undefined): string {
  if (!value)
    return new Date().toISOString()
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

function parseMessages(value: unknown): unknown[] {
  if (Array.isArray(value))
    return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    }
    catch {
      return []
    }
  }
  return []
}

function mapSessionRow(row: ChatSessionRow): ChatSessionRecord {
  return {
    city: row.city || null,
    createdAt: toIsoString(row.created_at),
    id: row.id,
    messages: parseMessages(row.messages),
    title: row.title || '新的手账对话',
    updatedAt: toIsoString(row.updated_at),
    userId: row.user_id,
  }
}

/** 查询当前用户的所有未删除会话列表（按更新时间降序） */
export async function listChatSessions(userId: string): Promise<ChatSessionRecord[]> {
  if (!userId)
    throw httpError(401, '未登录')

  const result = await query(
    `SELECT id, user_id, title, city, messages, created_at, updated_at
     FROM chat_sessions
     WHERE user_id = $1 AND deleted_at IS NULL
     ORDER BY updated_at DESC`,
    [userId],
  )

  return typedQuery<ChatSessionRow>(result.rows).map(mapSessionRow)
}

/** 查询当前用户的指定会话详情 */
export async function getChatSessionById(
  sessionId: string,
  userId: string,
): Promise<ChatSessionRecord | null> {
  if (!userId)
    throw httpError(401, '未登录')
  if (!sessionId)
    throw httpError(400, '会话 ID 不能为空')

  const result = await query(
    `SELECT id, user_id, title, city, messages, created_at, updated_at
     FROM chat_sessions
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    [sessionId, userId],
  )

  if (result.rows.length === 0)
    return null

  return mapSessionRow(result.rows[0] as ChatSessionRow)
}

/** 保存或更新会话（UPSERT 幂等操作） */
export async function saveChatSession(
  userId: string,
  input: SaveChatSessionInput,
): Promise<ChatSessionRecord> {
  if (!userId)
    throw httpError(401, '未登录')
  if (!input.id)
    throw httpError(400, '会话 ID 不能为空')

  const title = input.title?.trim() || '新的手账对话'
  const city = input.city?.trim() || null
  const messagesJson = JSON.stringify(input.messages || [])
  const createdAt = input.createdAt ? new Date(input.createdAt) : new Date()
  const updatedAt = input.updatedAt ? new Date(input.updatedAt) : new Date()

  // 检查是否存在属于其他用户的同名 ID
  const existing = await query(
    'SELECT user_id FROM chat_sessions WHERE id = $1',
    [input.id],
  )

  if (existing.rows.length > 0 && existing.rows[0].user_id !== userId) {
    throw httpError(403, '无权修改其他用户的会话')
  }

  const result = await query(
    `INSERT INTO chat_sessions (id, user_id, title, city, messages, created_at, updated_at, deleted_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NULL)
     ON CONFLICT (id) DO UPDATE
     SET title = EXCLUDED.title,
         city = EXCLUDED.city,
         messages = EXCLUDED.messages,
         updated_at = EXCLUDED.updated_at,
         deleted_at = NULL
     WHERE chat_sessions.user_id = $2
     RETURNING id, user_id, title, city, messages, created_at, updated_at`,
    [input.id, userId, title, city, messagesJson, createdAt, updatedAt],
  )

  if (result.rows.length === 0) {
    throw httpError(500, '保存会话失败')
  }

  return mapSessionRow(result.rows[0] as ChatSessionRow)
}

/** 软删除指定会话 */
export async function deleteChatSession(sessionId: string, userId: string): Promise<void> {
  if (!userId)
    throw httpError(401, '未登录')
  if (!sessionId)
    throw httpError(400, '会话 ID 不能为空')

  const result = await query(
    'SELECT user_id FROM chat_sessions WHERE id = $1 AND deleted_at IS NULL',
    [sessionId],
  )

  if (result.rows.length === 0)
    return

  if (result.rows[0].user_id !== userId) {
    throw httpError(403, '无权删除其他用户的会话')
  }

  await query(
    'UPDATE chat_sessions SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1 AND user_id = $2',
    [sessionId, userId],
  )
}

/** 清空当前用户的所有会话 */
export async function clearAllChatSessions(userId: string): Promise<void> {
  if (!userId)
    throw httpError(401, '未登录')

  await query(
    'UPDATE chat_sessions SET deleted_at = NOW(), updated_at = NOW() WHERE user_id = $1 AND deleted_at IS NULL',
    [userId],
  )
}
