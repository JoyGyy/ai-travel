/**
 * RAG 检索服务
 * 混合检索：关键词匹配 + TF-IDF 语义相似度
 *
 * 面试要点：
 * - RAG（Retrieval Augmented Generation）= 检索增强生成
 * - 先从知识库检索相关信息，再交给 LLM 生成回答
 * - 本项目使用混合检索：精确关键词匹配 + TF-IDF 语义加权
 */

import attractionsDB from '../knowledge/attractions.json' with { type: 'json' }
import { TFIDFIndex } from './tfidf.js'

// ========== 构建全局 TF-IDF 索引 ==========

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
 * @returns {object|null} 城市数据对象
 */
function getCityData(cityName) {
  return attractionsDB.find(c => c.city === cityName) || null
}

/**
 * 关键词匹配评分（原有逻辑）
 * @param {string[]} tags - 用户偏好标签
 * @param {string} query - 用户查询文本
 * @param {object[]} attractions - 景点列表
 * @returns {object[]} 匹配的景点列表（附带 keywordScore）
 */
function matchByKeyword(tags, query, attractions) {
  return attractions.map((attr) => {
    let score = 0
    const queryLower = query.toLowerCase()

    // 标签匹配：每个匹配的标签加 3 分
    for (const tag of tags) {
      if (attr.tags.includes(tag)) score += 3
    }

    // 描述匹配：包含关键词加 2 分
    if (queryLower && attr.description.toLowerCase().includes(queryLower)) score += 2

    // 名称匹配：包含关键词加 5 分
    if (queryLower && attr.name.toLowerCase().includes(queryLower)) score += 5

    // 标签文本匹配
    for (const tag of tags) {
      if (attr.name.includes(tag) || attr.description.includes(tag)) score += 1
    }

    // 必去标签加分
    if (attr.tags.includes('必去')) score += 2

    return { ...attr, keywordScore: score }
  })
}

/**
 * 混合检索：关键词 + TF-IDF
 * @param {string[]} tags - 用户偏好标签
 * @param {string} query - 用户查询文本
 * @param {object[]} attractions - 景点列表
 * @param {string} city - 城市名
 * @returns {object[]} 按综合分数排序的景点列表
 */
function matchAttractions(tags, query, attractions, city) {
  // 1. 关键词匹配
  const keywordResults = matchByKeyword(tags, query, attractions)

  // 2. TF-IDF 语义匹配
  const tfidfResults = globalIndex.search(query)
  const tfidfMap = new Map()
  for (const result of tfidfResults) {
    // 只取当前城市的景点
    if (result.id.startsWith(city + ':')) {
      tfidfMap.set(result.id.split(':')[1], result.score)
    }
  }

  // 3. 混合评分：关键词 × 0.4 + TF-IDF × 0.6（归一化后）
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
 * @returns {object|null} 检索结果
 */
function retrieve(city, preferenceTags = [], query = '') {
  const cityData = getCityData(city)
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
 * @returns {string[]} 城市名称数组
 */
function getAllCities() {
  return attractionsDB.map(c => c.city)
}

export { retrieve, getCityData, getAllCities }
