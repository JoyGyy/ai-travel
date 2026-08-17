/**
 * 图片服务模块（简化版）
 *
 * 支持多源图片获取：
 * 1. Unsplash API - 主要来源（免费额度：50次/小时）
 * 2. Pexels API - 备选来源（免费额度：200次/小时）
 * 3. 维基百科 - 最后备选
 */

// 缓存配置
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24小时
const imageCache = new Map<string, { timestamp: number, url: string }>()

/**
 * 批量获取景点图片
 */
export async function batchGetAttractionImages(
  attractions: Array<{ city?: string, name: string }>,
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // 并发获取（限制并发数）
  const concurrency = 3
  for (let i = 0; i < attractions.length; i += concurrency) {
    const batch = attractions.slice(i, i + concurrency)
    const promises = batch.map(async (attraction) => {
      const url = await getAttractionImage(attraction.name, attraction.city)
      return { name: attraction.name, url }
    })

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ name, url }) => results.set(name, url))

    // 避免API限流
    if (i + concurrency < attractions.length) {
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 1000)
      })
    }
  }

  return results
}

/**
 * 清除图片缓存
 */
export function clearImageCache(): void {
  imageCache.clear()
}

/**
 * 获取景点图片
 * @param attractionName 景点名称
 * @param city 城市名称（可选）
 * @returns 图片URL
 */
export async function getAttractionImage(attractionName: string, city?: string): Promise<string> {
  const query = city ? `${attractionName} ${city}` : attractionName

  // 检查缓存
  const cached = getFromCache(query)
  if (cached)
    return cached

  // 依次尝试各个图片源
  const sources = [
    { name: 'Unsplash', search: searchUnsplash },
    { name: 'Pexels', search: searchPexels },
    { name: 'Wikipedia', search: searchWikipedia },
  ]

  for (const source of sources) {
    const url = await source.search(query)
    if (url) {
      setCache(query, url)
      return url
    }
  }

  // 所有源都失败，返回默认图片
  return '/images/defaults/attraction.jpg'
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { size: number } {
  return { size: imageCache.size }
}

/**
 * 从缓存获取图片URL
 */
function getFromCache(key: string): null | string {
  const item = imageCache.get(key)
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.url
  }
  imageCache.delete(key)
  return null
}

/**
 * Pexels API 搜索
 */
async function searchPexels(query: string): Promise<null | string> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey)
    return null

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } },
    )

    if (!response.ok)
      return null

    const data = await response.json()
    return data.photos?.[0]?.src?.large || null
  }
  catch {
    return null
  }
}

/**
 * Unsplash API 搜索
 */
async function searchUnsplash(query: string): Promise<null | string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey)
    return null

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${accessKey}` } },
    )

    if (!response.ok)
      return null

    const data = await response.json()
    return data.results?.[0]?.urls?.regular || null
  }
  catch {
    return null
  }
}

/**
 * 维基百科图片搜索
 */
async function searchWikipedia(query: string): Promise<null | string> {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
    )

    if (!response.ok)
      return null

    const data = await response.json()
    if (data.thumbnail?.source) {
      return data.thumbnail.source.replace(/\/\d+px-/, '/1280px-')
    }
    return null
  }
  catch {
    return null
  }
}

/**
 * 存储到缓存
 */
function setCache(key: string, url: string): void {
  imageCache.set(key, { timestamp: Date.now(), url })
}
