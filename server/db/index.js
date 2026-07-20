/**
 * PostgreSQL 连接池
 * 未配置 DATABASE_URL 时导出 null，调用方据此降级到 JSON
 */

import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg

let pool = null

if (env.DATABASE_URL) {
  pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })

  pool.on('error', (err) => {
    console.error('[db] 连接池异常:', err.message)
  })
}

/**
 * 执行 SQL 查询
 * @param {string} text - SQL 语句（使用 $1, $2 参数占位）
 * @param {unknown[]} params - 参数数组
 * @returns {Promise<import('pg').QueryResult>}
 */
async function query(text, params) {
  if (!pool) throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.query(text, params)
}

/**
 * 获取独立客户端（用于事务）
 * @returns {Promise<import('pg').PoolClient>}
 */
async function getClient() {
  if (!pool) throw new Error('数据库未配置，请设置 DATABASE_URL 环境变量')
  return pool.connect()
}

export { getClient, query }
