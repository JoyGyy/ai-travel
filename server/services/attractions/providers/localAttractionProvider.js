import attractions from '../../../knowledge/attractions-product.json' with { type: 'json' }

const CITY_ORDER = ['北京', '上海', '杭州', '成都', '西安']

function normalizeText(value) {
  return String(value || '').trim().toLowerCase()
}

function includesText(value, keyword) {
  return normalizeText(value).includes(keyword)
}

function matchesKeyword(attraction, keyword) {
  if (!keyword)
    return true

  return [
    attraction.name,
    attraction.city,
    attraction.summary,
    attraction.description,
    ...(attraction.tags || []),
    ...(attraction.aliases || []),
  ].some(value => includesText(value, keyword))
}

function matchesFilters(attraction, filters = {}) {
  const keyword = normalizeText(filters.keyword)

  if (filters.city && attraction.city !== filters.city)
    return false

  if (filters.ticketType && attraction.ticketType !== filters.ticketType)
    return false

  if (filters.tag && !(attraction.tags || []).includes(filters.tag))
    return false

  return matchesKeyword(attraction, keyword)
}

function listAttractions(filters = {}) {
  return attractions.filter(item => matchesFilters(item, filters))
}

function searchAttractions(filters = {}) {
  return listAttractions(filters)
}

function getAttractionById(id) {
  return attractions.find(item => item.id === id) || null
}

function getAttractionMeta() {
  const cities = CITY_ORDER.filter(city => attractions.some(item => item.city === city))
  const tags = [...new Set(attractions.flatMap(item => item.tags || []))].sort((a, b) => a.localeCompare(b, 'zh-CN'))

  return { cities, tags }
}

export {
  getAttractionById,
  getAttractionMeta,
  listAttractions,
  searchAttractions,
}
