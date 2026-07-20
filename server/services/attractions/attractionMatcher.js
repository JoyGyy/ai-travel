/**
 * 行程景点匹配器
 * 从行程点位名称中匹配产品景点数据，生成 attractionRefs 引用列表
 */

import { searchAttractions } from './attractionService.js'

/**
 * 收集行程中所有景点名称
 */
function collectSpotNames(itinerary = []) {
  const names = []
  for (const day of itinerary) {
    for (const period of ['morning', 'afternoon', 'evening']) {
      const name = day?.[period]?.spot
      if (typeof name === 'string' && name.trim())
        names.push(name.trim())
    }
  }
  return names
}

/**
 * 从行程数据中匹配产品景点引用并去重
 * @param {Array} itinerary - 行程点位数组
 * @returns {Promise<Array>} 景点引用数组，包含 id, name, city, ticketType, priceText
 */
async function matchAttractionRefsFromItinerary(itinerary = []) {
  const refs = []
  const seen = new Set()

  for (const spotName of collectSpotNames(itinerary)) {
    const results = await searchAttractions({ keyword: spotName })
    const matched = results.find(
      item => item.name === spotName || (item.aliases || []).includes(spotName),
    )
    if (!matched || seen.has(matched.id))
      continue

    seen.add(matched.id)
    refs.push({
      id: matched.id,
      name: matched.name,
      city: matched.city,
      ticketType: matched.ticketType,
      priceText: matched.priceText,
    })
  }

  return refs
}

export { matchAttractionRefsFromItinerary }
