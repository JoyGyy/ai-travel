/**
 * PostgreSQL 连接池（纯 pg）
 * 使用全局单例防止 Serverless 环境创建多个连接池
 */
import type { PoolClient, QueryResult } from 'pg'

import pg from 'pg'

import { env } from './env'
import { createLogger } from './utils/logger'

const log = createLogger('db')

const { Pool } = pg

// ========== 全局单例连接池 ==========

const globalForDb = globalThis as unknown as {
  _pgPool: null | pg.Pool
}

function getPool(): null | pg.Pool {
  if (!env.DATABASE_URL) return null

  if (!globalForDb._pgPool) {
    globalForDb._pgPool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
      max: 10,
    })

    globalForDb._pgPool.on('error', (err: Error) => {
      log.error('连接池异常:', err.message)
    })
  }

  return globalForDb._pgPool
}

// ========== 导出 ==========

/** 将查询结果类型安全地转换为指定类型 */
export function typedQuery<T>(result: unknown[]): T[] {
  return result as unknown as T[]
}

async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  if (!pool) throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.connect()
}

/** 执行 SQL 查询 */
async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const pool = getPool()
  if (!pool) throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.query(text, params)
}

export { getClient, query }
