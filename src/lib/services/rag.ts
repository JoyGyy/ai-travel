/**
 * RAG 检索服务
 * 混合检索：向量语义搜索 + 关键词匹配
 * 当 embedding 不可用时降级为 TF-IDF
 */
import { sql } from 'drizzle-orm'

import { attractionKnowledge } from '@/db/schema'

import { db } from '../db'
import { createLogger } from '../utils/logger'
import { formatEmbeddingForPg, generateEmbedding } from './embedding'
import { TFIDFIndex } from './tfidf'

const log = createLogger('rag')

export interface AttractionKnowledge {
  description: string
  duration: string
  indoor: boolean
  name: string
  tags: string[]
  ticket: number
  tips: string
}

export interface CityKnowledge {
  accommodation: unknown[]
  attractions: AttractionKnowledge[]
  bestSeason: string
  city: string
  food: string[]
  nightlife: unknown[]
  transport: string
}

export interface SearchResult {
  attractions: Array<
    AttractionKnowledge & { keywordScore: number; score: number; tfidfScore: number }
  >
  bestSeason: string
  city: string
  food: string[]
  transport: string
}

let knowledgeCache: CityKnowledge[] | null = null
const globalIndex = new TFIDFIndex()

async function getAllCities(): Promise<string[]> {
  const data = await loadKnowledge()
  return data.map((c) => c.city)
}

async function getCityData(cityName: string): Promise<CityKnowledge | null> {
  const data = await loadKnowledge()
  return data.find((c) => c.city === cityName) || null
}

/** 从数据库加载景点知识库并构建 TF-IDF 索引（带缓存） */
async function loadKnowledge(): Promise<CityKnowledge[]> {
  if (knowledgeCache) return knowledgeCache

  const rows = await db
    .select({
      accommodation: attractionKnowledge.accommodation,
      bestSeason: attractionKnowledge.bestSeason,
      city: attractionKnowledge.city,
      description: attractionKnowledge.description,
      duration: attractionKnowledge.duration,
      food: attractionKnowledge.food,
      indoor: attractionKnowledge.indoor,
      name: attractionKnowledge.name,
      nightlife: attractionKnowledge.nightlife,
      tags: attractionKnowledge.tags,
      ticket: attractionKnowledge.ticket,
      tips: attractionKnowledge.tips,
      transport: attractionKnowledge.transport,
    })
    .from(attractionKnowledge)
    .orderBy(attractionKnowledge.city, attractionKnowledge.name)

  const cityMap = new Map<string, CityKnowledge>()
  for (const row of rows) {
    if (!cityMap.has(row.city)) {
      cityMap.set(row.city, {
        accommodation:
          typeof row.accommodation === 'string'
            ? JSON.parse(row.accommodation)
            : row.accommodation || [],
        attractions: [],
        bestSeason: row.bestSeason || '',
        city: row.city,
        food: row.food || [],
        nightlife:
          typeof row.nightlife === 'string' ? JSON.parse(row.nightlife) : row.nightlife || [],
        transport: row.transport || '',
      })
    }
    cityMap.get(row.city)!.attractions.push({
      description: row.description,
      duration: row.duration,
      indoor: row.indoor,
      name: row.name,
      tags: row.tags || [],
      ticket: Number(row.ticket),
      tips: row.tips,
    })
  }

  knowledgeCache = [...cityMap.values()]

  // 构建 TF-IDF 索引文档：将景点名称、描述、标签拼接为文本
  const docs: Array<{ id: string; text: string }> = []
  for (const cityData of knowledgeCache) {
    for (const attr of cityData.attractions) {
      const id = `${cityData.city}:${attr.name}`
      const text = `${attr.name} ${attr.description} ${attr.tags.join(' ')} ${attr.tips || ''}`
      docs.push({ id, text })
    }
  }
  globalIndex.buildIndex(docs)

  return knowledgeCache
}

/**
 * 混合检索：向量 + 关键词
 */
async function matchAttractions(
  tags: string[],
  queryText: string,
  attractions: AttractionKnowledge[],
  city: string,
) {
  const keywordResults = matchByKeyword(tags, queryText, attractions)

  // 尝试向量搜索
  const vectorScores = await vectorSearch(queryText, city)
  const hasVector = vectorScores.size > 0

  // 如果向量搜索不可用，使用 TF-IDF 作为降级
  const tfidfScores = new Map<string, number>()
  if (!hasVector) {
    const tfidfResults = globalIndex.search(queryText)
    for (const result of tfidfResults) {
      if (result.id.startsWith(`${city}:`)) {
        tfidfScores.set(result.id.split(':')[1], result.score)
      }
    }
  }

  const maxKeyword = Math.max(...keywordResults.map((a) => a.keywordScore), 1)
  const scoreSource = hasVector ? vectorScores : tfidfScores
  const maxScore = Math.max(...scoreSource.values(), 0.01)
  const hasKeywords = tags.length > 0 || queryText.length > 0

  const scored = keywordResults.map((attr) => {
    const kwNorm = attr.keywordScore / maxKeyword
    const scoreNorm = (scoreSource.get(attr.name) || 0) / maxScore
    // 向量搜索权重 0.7，关键词 0.3；TF-IDF 降级时权重 0.6 + 0.4
    const scoreWeight = hasVector ? 0.7 : 0.6
    const kwWeight = hasVector ? 0.3 : 0.4
    const finalScore = kwNorm * kwWeight + scoreNorm * scoreWeight

    return {
      ...attr,
      keywordScore: attr.keywordScore,
      score: finalScore,
      tfidfScore: scoreSource.get(attr.name) || 0,
    }
  })

  return scored.filter((a) => !hasKeywords || a.score > 0).sort((a, b) => b.score - a.score)
}

/** 关键词匹配：根据标签和文本匹配景点，返回带关键词得分的结果 */
function matchByKeyword(tags: string[], queryText: string, attractions: AttractionKnowledge[]) {
  return attractions.map((attr) => {
    let score = 0
    const queryLower = queryText.toLowerCase()

    for (const tag of tags) {
      if (attr.tags.includes(tag)) score += 3
    }

    if (queryLower && attr.description.toLowerCase().includes(queryLower)) score += 2
    if (queryLower && attr.name.toLowerCase().includes(queryLower)) score += 5

    for (const tag of tags) {
      if (attr.name.includes(tag) || attr.description.includes(tag)) score += 1
    }

    if (attr.tags.includes('必去')) score += 2

    return { ...attr, keywordScore: score }
  })
}

async function retrieve(
  city: string,
  preferenceTags: string[] = [],
  queryText = '',
): Promise<null | SearchResult> {
  const cityData = await getCityData(city)
  if (!cityData) return null

  const matchedAttractions = await matchAttractions(
    preferenceTags,
    queryText,
    cityData.attractions,
    city,
  )

  return {
    attractions: matchedAttractions,
    bestSeason: cityData.bestSeason,
    city: cityData.city,
    food: cityData.food,
    transport: cityData.transport,
  }
}

/**
 * 向量搜索：使用 pgvector 进行语义相似度搜索
 */
async function vectorSearch(queryText: string, city: string): Promise<Map<string, number>> {
  const scoreMap = new Map<string, number>()

  const embedding = await generateEmbedding(queryText)
  if (!embedding) return scoreMap

  const vectorStr = formatEmbeddingForPg(embedding)

  try {
    const result = await db.execute<{ name: string; similarity: number }>(sql`
      SELECT name, 1 - (embedding <=> ${vectorStr}::vector) AS similarity
      FROM attraction_knowledge
      WHERE city = ${city} AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vectorStr}::vector
      LIMIT 10
    `)

    for (const row of result.rows) {
      scoreMap.set(row.name, Number(row.similarity))
    }
  } catch (err) {
    log.warn('向量搜索失败，降级到 TF-IDF:', (err as Error).message)
  }

  return scoreMap
}

export { getAllCities, getCityData, retrieve }
