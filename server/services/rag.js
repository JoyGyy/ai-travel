/**
 * RAG 检索服务
 * 混合检索：关键词匹配 + TF-IDF 语义相似度
 * 已配置 DATABASE_URL 时从 PostgreSQL 读取知识库，否则降级到 JSON
 *
 * 面试要点：
 * - RAG（Retrieval Augmented Generation）= 检索增强生成
 * - 先从知识库检索相关信息，再交给 LLM 生成回答
 * - 本项目使用混合检索：精确关键词匹配 + TF-IDF 语义加权
 */

import { isDbReady, query } from '../db/index.js'
import attractionsDB from '../knowledge/attractions.json' with { type: 'json' }
import { TFIDFIndex } from './tfidf.js'

// ========== 根据数据库配置选择数据源 ==========

let usePg = false
let knowledgeCache = null

/**
 * 从 PostgreSQL 加载知识库数据并缓存
 */
async function loadKnowledgeFromPg() {
  if (knowledgeCache) return knowledgeCache

  const result = await query(
    'SELECT city, name, description, ticket, duration, tips, indoor, tags, food, transport, best_season, accommodation, nightlife FROM attraction_knowledge ORDER BY city, name',
  )

  // 按城市分组，模拟原 attractions.json 结构
  const cityMap = new Map()
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
    cityMap.get(row.city).attractions.push({
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
  return knowledgeCache
}

/**
 * 获取知识库数据（PG 或 JSON）
 */
async function getKnowledgeBase() {
  if (usePg) return loadKnowledgeFromPg()
  return attractionsDB
}

// 初始化：检测是否使用 PG
if (isDbReady()) {
  usePg = true
}

// ========== 构建全局 TF-IDF 索引（JSON 模式使用） ==========

const globalIndex = new TFIDFIndex()
;(function buildGlobalIndex() {
  const docs = []
  for (const cityData of attractionsDB) {
    for (const attr of cityData.attractions) {
      const id = `${cityData.city}:${attr.name}`
      const text = `${attr.name} ${attr.description} ${attr.tags.join(' ')} ${attr.tips || ''}`
      docs.push({ id, text })
    }
  }
  globalIndex.buildIndex(docs)
})()

/**
 * 根据城市名获取城市数据
 * @param {string} cityName - 城市名称
 * @returns {Promise<object|null>} 城市数据对象
 */
async function getCityData(cityName) {
  const db = await getKnowledgeBase()
  return db.find(c => c.city === cityName) || null
}

/**
 * 关键词匹配评分
 */
function matchByKeyword(tags, query, attractions) {
  return attractions.map((attr) => {
    let score = 0
    const queryLower = query.toLowerCase()

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

/**
 * 混合检索：关键词 + TF-IDF
 */
function matchAttractions(tags, query, attractions, city) {
  const keywordResults = matchByKeyword(tags, query, attractions)

  const tfidfResults = globalIndex.search(query)
  const tfidfMap = new Map()
  for (const result of tfidfResults) {
    if (result.id.startsWith(city + ':')) {
      tfidfMap.set(result.id.split(':')[1], result.score)
    }
  }

  const maxKeyword = Math.max(...keywordResults.map(a => a.keywordScore), 1)
  const maxTfidf = Math.max(...tfidfMap.values(), 0.01)
  const hasKeywords = tags.length > 0 || query.length > 0

  const scored = keywordResults.map((attr) => {
    const kwNorm = attr.keywordScore / maxKeyword
    const tfNorm = (tfidfMap.get(attr.name) || 0) / maxTfidf
    const finalScore = kwNorm * 0.4 + tfNorm * 0.6

    return {
      ...attr,
      score: finalScore,
      keywordScore: attr.keywordScore,
      tfidfScore: tfidfMap.get(attr.name) || 0,
    }
  })

  return scored
    .filter(a => !hasKeywords || a.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * RAG 检索主函数
 * @param {string} city - 城市名
 * @param {string[]} preferenceTags - 用户偏好标签
 * @param {string} query - 用户查询文本
 * @returns {Promise<object|null>} 检索结果
 */
async function retrieve(city, preferenceTags = [], query = '') {
  const cityData = await getCityData(city)
  if (!cityData) return null

  const matchedAttractions = matchAttractions(preferenceTags, query, cityData.attractions, city)

  return {
    city: cityData.city,
    attractions: matchedAttractions,
    food: cityData.food,
    transport: cityData.transport,
    bestSeason: cityData.bestSeason,
  }
}

/**
 * 获取所有城市名称列表
 * @returns {Promise<string[]>}
 */
async function getAllCities() {
  const db = await getKnowledgeBase()
  return db.map(c => c.city)
}

export { retrieve, getCityData, getAllCities }
