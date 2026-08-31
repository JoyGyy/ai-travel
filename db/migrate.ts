/**
 * 数据库 Migration 管理脚本
 * 用法:
 *   pnpm db:migrate          — 执行所有未应用的 migration
 *   pnpm db:migrate status   — 查看 migration 状态
 *   pnpm db:migrate fresh    — 清空数据库并重新执行所有 migration（危险！）
 */
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import pg from 'pg'

import { env } from '../src/lib/env'

const { Pool } = pg

const MIGRATIONS_DIR = join(import.meta.dirname, 'migrations')

/** 清空数据库并重新执行（危险操作） */
async function freshDatabase(pool: pg.Pool) {
  console.log('⚠️  即将清空数据库并重新执行所有 migration')
  console.log('   这会删除所有数据！\n')

  // 删除所有用户表（保留系统表）
  const tablesResult = await pool.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename != '_migrations'
  `)

  const tables = tablesResult.rows.map((r: { tablename: string }) => r.tablename)

  if (tables.length > 0) {
    console.log(`🗑️  删除 ${tables.length} 张表: ${tables.join(', ')}`)
    await pool.query(`DROP TABLE IF EXISTS ${tables.map((t: string) => `"${t}"`).join(', ')} CASCADE`)
  }

  // 清空 migration 记录
  await pool.query('DELETE FROM _migrations')
  console.log('🗑️  清空 migration 记录\n')

  // 重新执行所有 migration
  await runMigrations(pool)
}

/** 获取已应用的 migration 列表 */
async function getAppliedMigrations(pool: pg.Pool): Promise<Set<string>> {
  const result = await pool.query('SELECT name FROM _migrations ORDER BY id')
  return new Set(result.rows.map((r: { name: string }) => r.name))
}

/** 获取所有 migration 文件（按文件名排序） */
function getMigrationFiles(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
}

async function main() {
  const command = process.argv[2] || 'run'

  if (!env.DATABASE_URL) {
    console.error('❌ DATABASE_URL 环境变量未设置')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: env.DATABASE_URL })

  try {
    // 确保 _migrations 表存在
    await pool.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        name        TEXT UNIQUE NOT NULL,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)

    switch (command) {
      case 'fresh':
        await freshDatabase(pool)
        break
      case 'status':
        await showStatus(pool)
        break
      case 'run':
      default:
        await runMigrations(pool)
        break
    }
  }
  catch (err) {
    console.error('❌ Migration 失败:', err)
    process.exit(1)
  }
  finally {
    await pool.end()
  }
}

/** 执行所有未应用的 migration */
async function runMigrations(pool: pg.Pool) {
  const files = getMigrationFiles()
  const applied = await getAppliedMigrations(pool)

  const pending = files.filter(f => !applied.has(f))

  if (pending.length === 0) {
    console.log('✅ 所有 migration 已应用，无需操作')
    return
  }

  console.log(`📦 发现 ${pending.length} 个待执行的 migration\n`)

  for (const file of pending) {
    const filePath = join(MIGRATIONS_DIR, file)
    const sql = readFileSync(filePath, 'utf-8')

    console.log(`▶ 执行: ${file}`)
    await pool.query(sql)
    await pool.query(
      'INSERT INTO _migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [file],
    )
    console.log(`✅ 完成: ${file}\n`)
  }

  console.log(`🎉 全部 ${pending.length} 个 migration 执行成功`)
}

/** 查看 migration 状态 */
async function showStatus(pool: pg.Pool) {
  const files = getMigrationFiles()
  const applied = await getAppliedMigrations(pool)

  console.log('\n📊 Migration 状态:\n')
  console.log(`${'状态'.padEnd(6)}文件名`)
  console.log('─'.repeat(50))

  for (const file of files) {
    const status = applied.has(file) ? '✅' : '⏳'
    console.log(`${status}  ${file}`)
  }

  const pending = files.filter(f => !applied.has(f))
  console.log(`\n共 ${files.length} 个 migration，${pending.length} 个待执行`)
}

main()
