/**
 * PostgreSQL 连接池
 * 未配置 DATABASE_URL 时导出 null，调用方据此降级到 JSON
 */
import type { PoolClient, QueryResult } from 'pg'

import pg from 'pg'
import { env } from '../config/env.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('db')

const { Pool } = pg

let pool: pg.Pool | null = null

if (env.DATABASE_URL) {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  pool.on('error', (err: Error) => {
    log.error('连接池异常:', err.message)
  })
}

async function query(text: string, params?: unknown[]): Promise<QueryResult> {
  if (!pool)
    throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.query(text, params)
}

async function getClient(): Promise<PoolClient> {
  if (!pool)
    throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.connect()
}

export { getClient, query }
