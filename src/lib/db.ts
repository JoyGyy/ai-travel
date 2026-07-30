/**
 * PostgreSQL 连接池 + Drizzle ORM 实例
 * 使用全局单例防止 Serverless 环境创建多个连接池
 */
import type { PoolClient, QueryResult } from 'pg'

import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

import * as schema from '@/db/schema'

import { env } from './env'
import { createLogger } from './utils/logger'

const log = createLogger('db')

const { Pool } = pg

// ========== 全局单例连接池 ==========

const globalForDb = globalThis as unknown as { _pgPool: pg.Pool | null, _drizzleDb: ReturnType<typeof drizzle<typeof schema>> | null }

function getPool(): pg.Pool | null {
  if (!env.DATABASE_URL)
    return null

  if (!globalForDb._pgPool) {
    globalForDb._pgPool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })

    globalForDb._pgPool.on('error', (err: Error) => {
      log.error('连接池异常:', err.message)
    })
  }

  return globalForDb._pgPool
}

/** 获取 Drizzle ORM 实例（延迟初始化，全局单例） */
function getDb() {
  if (!globalForDb._drizzleDb) {
    const pool = getPool()
    if (!pool)
      throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
    globalForDb._drizzleDb = drizzle(pool, { schema })
  }
  return globalForDb._drizzleDb
}

// ========== 导出 ==========

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    const instance = getDb()
    const value = Reflect.get(instance, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(instance)
    }
    return value
  },
})

/** 执行 SQL 查询（保留用于 pgvector 等原生查询场景） */
async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  const pool = getPool()
  if (!pool)
    throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.query(text, params)
}

async function getClient(): Promise<PoolClient> {
  const pool = getPool()
  if (!pool)
    throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.connect()
}

/** 将 Drizzle sql 查询结果类型安全地转换为指定类型 */
export function typedQuery<T>(result: unknown[]): T[] {
  return result as unknown as T[]
}

export { getClient, query }
