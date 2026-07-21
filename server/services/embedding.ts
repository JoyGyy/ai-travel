/**
 * Embedding 服务
 * 调用 SiliconFlow API 生成文本向量，用于 pgvector 语义搜索
 */
import { env } from '../config/env.js'
import { createLogger } from '../utils/logger.js'

const log = createLogger('embedding')

const EMBEDDING_MODEL = 'BAAI/bge-large-zh-v1.5'
const EMBEDDING_DIMENSION = 1024

export interface EmbeddingConfig {
  baseUrl: string
  apiKey: string
}

function getEmbeddingConfig(): EmbeddingConfig | null {
  if (!env.SILICONFLOW_API_KEY)
    return null

  return {
    baseUrl: env.SILICONFLOW_BASE_URL,
    apiKey: env.SILICONFLOW_API_KEY,
  }
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const config = getEmbeddingConfig()
  if (!config) {
    log.warn('未配置 SiliconFlow API Key，跳过 embedding 生成')
    return null
  }

  try {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      log.error(`Embedding API 调用失败: ${response.status} ${errText}`)
      return null
    }

    const data = await response.json() as { data?: Array<{ embedding?: number[] }> }
    return data.data?.[0]?.embedding || null
  }
  catch (err) {
    log.error('Embedding 生成失败:', (err as Error).message)
    return null
  }
}

export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const config = getEmbeddingConfig()
  if (!config) {
    log.warn('未配置 SiliconFlow API Key，跳过 embedding 批量生成')
    return texts.map(() => null)
  }

  // SiliconFlow 支持批量 embedding
  try {
    const response = await fetch(`${config.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: texts,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      log.error(`Embedding 批量 API 调用失败: ${response.status} ${errText}`)
      return texts.map(() => null)
    }

    const data = await response.json() as { data?: Array<{ embedding?: number[] }> }
    return texts.map((_, i) => data.data?.[i]?.embedding || null)
  }
  catch (err) {
    log.error('Embedding 批量生成失败:', (err as Error).message)
    return texts.map(() => null)
  }
}

export function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}

export { EMBEDDING_DIMENSION }
