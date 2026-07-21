/**
 * 批量生成 Knowledge Base Embeddings
 * 为 attraction_knowledge 表中的每条记录生成向量嵌入
 * 用法: npx tsx scripts/generate-embeddings.ts
 */

/* eslint-disable no-console -- CLI 脚本需要输出进度信息 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from 'dotenv'
import pg from 'pg'
import { EMBEDDING_DIMENSION, formatEmbeddingForPg, generateEmbeddings } from '../services/embedding.js'

config({ path: path.resolve(import.meta.dirname!, '../../.env') })

const { Pool } = pg
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  console.error('错误: 请在 .env 中配置 DATABASE_URL')
  process.exit(1)
}

const pool = new Pool({ connectionString: DATABASE_URL })

const SCHEMA_PATH = path.join(import.meta.dirname!, '../db/schema.sql')

async function ensureSchema(client: pg.PoolClient) {
  const sql = await readFile(SCHEMA_PATH, 'utf-8')
  await client.query(sql)
  console.log('✓ Schema 更新完成')
}

async function generateAllEmbeddings() {
  const client = await pool.connect()
  try {
    await ensureSchema(client)

    // 获取所有没有 embedding 的记录
    const result = await client.query(
      `SELECT id, city, name, description, tags, tips
       FROM attraction_knowledge
       WHERE embedding IS NULL
       ORDER BY city, name`,
    )

    const rows = result.rows
    if (rows.length === 0) {
      console.log('✓ 所有记录已有 embedding，无需更新')
      return
    }

    console.log(`找到 ${rows.length} 条需要生成 embedding 的记录`)

    // 批量生成 embedding
    const batchSize = 20
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      const texts = batch.map(row =>
        `${row.name} ${row.description} ${(row.tags || []).join(' ')} ${row.tips || ''}`,
      )

      console.log(`处理第 ${i + 1}-${Math.min(i + batchSize, rows.length)} 条...`)
      const embeddings = await generateEmbeddings(texts)

      // 更新数据库
      for (let j = 0; j < batch.length; j++) {
        const embedding = embeddings[j]
        if (embedding && embedding.length === EMBEDDING_DIMENSION) {
          await client.query(
            'UPDATE attraction_knowledge SET embedding = $1 WHERE id = $2',
            [formatEmbeddingForPg(embedding), batch[j].id],
          )
        }
        else {
          console.warn(`⚠ 跳过 ${batch[j].city}/${batch[j].name}：embedding 生成失败`)
        }
      }

      // 避免 API 限流
      if (i + batchSize < rows.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    console.log('✓ Embedding 生成完成')
  }
  finally {
    client.release()
    await pool.end()
  }
}

generateAllEmbeddings().catch((err) => {
  console.error('生成失败:', err.message)
  process.exit(1)
})
