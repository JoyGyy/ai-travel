/**
 * RAG 检索服务
 * 混合检索：向量语义搜索 + 关键词匹配
 * 当 embedding 不可用时降级为 TF-IDF
 */
import { query } from '../db/index.js'
import { createLogger } from '../utils/logger.js'
import { formatEmbeddingForPg, generateEmbedding } from './embedding.js'
import { TFIDFIndex } from './tfidf.js'

const log = createLogger('rag')

export interface AttractionKnowledge {
  name: string
  description: string
  ticket: number
  duration: string
  tips: string
  indoor: boolean
  tags: string[]
}

export interface CityKnowledge {
  city: string
  attractions: AttractionKnowledge[]
  food: string[]
  transport: string
  bestSeason: string
  accommodation: unknown[]
  nightlife: unknown[]
}

export interface SearchResult {
  city: string
  attractions: Array<AttractionKnowledge & { score: number, keywordScore: number, tfidfScore: number }>
  food: string[]
  transport: string
  bestSeason: string
}

let knowledgeCache: CityKnowledge[] | null = null
const globalIndex = new TFIDFIndex()

async function loadKnowledge(): Promise<CityKnowledge[]> {
  if (knowledgeCache)
    return knowledgeCache

  const result = await query(
    'SELECT city, name, description, ticket, duration, tips, indoor, tags, food, transport, best_season, accommodation, nightlife FROM attraction_knowledge ORDER BY city, name',
  )

  const cityMap = new Map<string, CityKnowledge>()
  for (const row of result.rows) {
    if (!cityMap.has(row.city)) {
      cityMap.set(row.city, {
        city: row.city,
        attractions: [],
        food: row.food || [],
        transport: row.transport || '',
        bestSeason: row.best_season || '',
        accommodation: typeof row.accommodation === 'string' ? JSON.parse(row.accommodation) : (row.accommodation || []),
        nightlife: typeof row.nightlife === 'string' ? JSON.parse(row.nightlife) : (row.nightlife || []),
      })
    }
    cityMap.get(row.city)!.attractions.push({
      name: row.name,
      description: row.description,
      ticket: Number(row.ticket),
      duration: row.duration,
      tips: row.tips,
      indoor: row.indoor,
      tags: row.tags || [],
    })
  }

  knowledgeCache = [...cityMap.values()]

  const docs: Array<{ id: string, text: string }> = []
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

async function getCityData(cityName: string): Promise<CityKnowledge | null> {
  const db = await loadKnowledge()
  return db.find(c => c.city === cityName) || null
}

function matchByKeyword(tags: string[], queryText: string, attractions: AttractionKnowledge[]) {
  return attractions.map((attr) => {
    let score = 0
    const queryLower = queryText.toLowerCase()

    for (const tag of tags) {
      if (attr.tags.includes(tag))
        score += 3
    }

    if (queryLower && attr.description.toLowerCase().includes(queryLower))
      score += 2
    if (queryLower && attr.name.toLowerCase().includes(queryLower))
      score += 5

    for (const tag of tags) {
      if (attr.name.includes(tag) || attr.description.includes(tag))
        score += 1
    }

    if (attr.tags.includes('必去'))
      score += 2

    return { ...attr, keywordScore: score }
  })
}

/**
 * 向量搜索：使用 pgvector 进行语义相似度搜索
 */
async function vectorSearch(queryText: string, city: string): Promise<Map<string, number>> {
  const scoreMap = new Map<string, number>()

  const embedding = await generateEmbedding(queryText)
  if (!embedding)
    return scoreMap

  const vectorStr = formatEmbeddingForPg(embedding)

  try {
    const result = await query(
      `SELECT name, 1 - (embedding <=> $1::vector) AS similarity
       FROM attraction_knowledge
       WHERE city = $2 AND embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT 10`,
      [vectorStr, city],
    )

    for (const row of result.rows) {
      scoreMap.set(row.name, Number(row.similarity))
    }
  }
  catch (err) {
    log.warn('向量搜索失败，降级到 TF-IDF:', (err as Error).message)
  }

  return scoreMap
}

/**
 * 混合检索：向量 + 关键词
 */
async function matchAttractions(tags: string[], queryText: string, attractions: AttractionKnowledge[], city: string) {
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

  const maxKeyword = Math.max(...keywordResults.map(a => a.keywordScore), 1)
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
      score: finalScore,
      keywordScore: attr.keywordScore,
      tfidfScore: scoreSource.get(attr.name) || 0,
    }
  })

  return scored
    .filter(a => !hasKeywords || a.score > 0)
    .sort((a, b) => b.score - a.score)
}

async function retrieve(city: string, preferenceTags: string[] = [], queryText = ''): Promise<SearchResult | null> {
  const cityData = await getCityData(city)
  if (!cityData)
    return null

  const matchedAttractions = await matchAttractions(preferenceTags, queryText, cityData.attractions, city)

  return {
    city: cityData.city,
    attractions: matchedAttractions,
    food: cityData.food,
    transport: cityData.transport,
    bestSeason: cityData.bestSeason,
  }
}

async function getAllCities(): Promise<string[]> {
  const db = await loadKnowledge()
  return db.map(c => c.city)
}

export { getAllCities, getCityData, retrieve }
