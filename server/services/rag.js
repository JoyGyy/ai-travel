/**
 * RAG 检索服务
 * 基于关键词匹配的景点知识库检索
 */

const attractionsDB = require('../knowledge/attractions.json')

/**
 * 根据城市名获取城市数据
 * @param {string} cityName - 城市名称
 * @returns {object|null} 城市数据对象
 */
function getCityData(cityName) {
  return attractionsDB.find(c => c.city === cityName) || null
}

/**
 * 根据关键词匹配景点
 * @param {string[]} tags - 用户偏好的标签关键词
 * @param {string} query - 用户输入的查询文本
 * @param {object[]} attractions - 景点列表
 * @returns {object[]} 匹配的景点列表（按相关度排序）
 */
function matchAttractions(tags, query, attractions) {
  const scored = attractions.map((attr) => {
    let score = 0
    const queryLower = query.toLowerCase()

    // 标签匹配：每个匹配的标签加 3 分
    for (const tag of tags) {
      if (attr.tags.includes(tag)) {
        score += 3
      }
    }

    // 描述匹配：包含关键词加 2 分
    if (queryLower && attr.description.includes(queryLower)) {
      score += 2
    }

    // 名称匹配：包含关键词加 5 分
    if (queryLower && attr.name.includes(queryLower)) {
      score += 5
    }

    // 景点名称在 tags 中的关键词匹配
    for (const tag of tags) {
      if (attr.name.includes(tag) || attr.description.includes(tag)) {
        score += 1
      }
    }

    // 必去标签加分
    if (attr.tags.includes('必去')) {
      score += 2
    }

    return { ...attr, score }
  })

  // 按分数排序，过滤掉零分景点（如果没有关键词则返回全部）
  const hasKeywords = tags.length > 0 || query.length > 0
  return scored
    .filter(a => !hasKeywords || a.score > 0)
    .sort((a, b) => b.score - a.score)
}

/**
 * RAG 检索主函数
 * @param {string} city - 城市名
 * @param {string[]} preferenceTags - 用户偏好标签
 * @param {string} query - 用户查询文本
 * @returns {object|null} 检索结果，包含城市信息和匹配的景点
 */
function retrieve(city, preferenceTags = [], query = '') {
  const cityData = getCityData(city)
  if (!cityData) {
    return null
  }

  const matchedAttractions = matchAttractions(preferenceTags, query, cityData.attractions)

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

module.exports = { retrieve, getCityData, getAllCities }
