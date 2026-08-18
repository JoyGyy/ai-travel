/**
 * 图片服务模块
 *
 * 支持多源图片获取：
 * 1. Unsplash API - 主要来源（免费额度：50次/小时）
 * 2. Pexels API - 备选来源（免费额度：200次/小时）
 * 3. 维基百科 - 最后备选
 *
 * 带有内存缓存机制，避免重复API调用
 */
import { createLogger } from './utils/logger'

const log = createLogger('image-service')

// 缓存项
interface CacheItem {
  timestamp: number
  url: string
}

// 图片源配置
interface ImageSource {
  name: string
  search: (query: string) => Promise<null | string>
}

// 缓存配置
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24小时
const CACHE_MAX_SIZE = 1000

// 内存缓存
const imageCache = new Map<string, CacheItem>()

/**
 * 清理过期缓存
 */
function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, item] of imageCache.entries()) {
    if (now - item.timestamp > CACHE_TTL) {
      imageCache.delete(key)
    }
  }

  // 如果缓存过大，删除最旧的项
  if (imageCache.size > CACHE_MAX_SIZE) {
    const entries = Array.from(imageCache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, entries.length - CACHE_MAX_SIZE)
    toDelete.forEach(([key]) => imageCache.delete(key))
  }
}

/**
 * 从缓存获取图片URL
 */
function getFromCache(query: string): null | string {
  cleanExpiredCache()
  const item = imageCache.get(query)
  if (item) {
    return item.url
  }
  return null
}

/**
 * Pexels API 搜索
 * 文档：https://www.pexels.com/api/documentation/
 */
async function searchPexels(query: string): Promise<null | string> {
  const apiKey = process.env.PEXELS_API_KEY
  if (!apiKey) {
    console.warn('PEXELS_API_KEY not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: apiKey,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status}`)
    }

    const data = await response.json()
    if (data.photos && data.photos.length > 0) {
      // 返回large尺寸（宽度1280px）
      return data.photos[0].src.large
    }
    return null
  }
  catch (error) {
    console.error('Pexels search failed:', error)
    return null
  }
}

/**
 * Unsplash API 搜索
 * 文档：https://unsplash.com/documentation
 */
async function searchUnsplash(query: string): Promise<null | string> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    console.warn('UNSPLASH_ACCESS_KEY not configured')
    return null
  }

  try {
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      },
    )

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`)
    }

    const data = await response.json()
    if (data.results && data.results.length > 0) {
      // 返回regular尺寸（1080px宽）
      return data.results[0].urls.regular
    }
    return null
  }
  catch (error) {
    console.error('Unsplash search failed:', error)
    return null
  }
}

/**
 * 维基百科图片搜索
 * 作为最后的备选方案
 */
async function searchWikipedia(query: string): Promise<null | string> {
  try {
    // 使用维基百科API搜索图片
    const searchResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
    )

    if (!searchResponse.ok) {
      return null
    }

    const data = await searchResponse.json()
    if (data.thumbnail && data.thumbnail.source) {
      // 返回较大尺寸的图片
      return data.thumbnail.source.replace(/\/\d+px-/, '/1280px-')
    }
    return null
  }
  catch (error) {
    console.error('Wikipedia search failed:', error)
    return null
  }
}

/**
 * 存储到缓存
 */
function setCache(query: string, url: string): void {
  imageCache.set(query, {
    timestamp: Date.now(),
    url,
  })
}

/**
 * 图片源列表（按优先级排序）
 */
const imageSources: ImageSource[] = [
  { name: 'Unsplash', search: searchUnsplash },
  { name: 'Pexels', search: searchPexels },
  { name: 'Wikipedia', search: searchWikipedia },
]

/**
 * 批量获取景点图片
 * @param attractions 景点列表
 * @returns 景点名称到图片URL的映射
 */
export async function batchGetAttractionImages(
  attractions: Array<{ city?: string, name: string }>,
): Promise<Map<string, string>> {
  const results = new Map<string, string>()

  // 并发获取（限制并发数避免API限流）
  const concurrency = 3
  for (let i = 0; i < attractions.length; i += concurrency) {
    const batch = attractions.slice(i, i + concurrency)
    const promises = batch.map(async (attraction) => {
      const url = await getAttractionImage(attraction.name, attraction.city)
      return { name: attraction.name, url }
    })

    const batchResults = await Promise.all(promises)
    batchResults.forEach(({ name, url }) => {
      results.set(name, url)
    })

    // 避免API限流，批次间等待
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
 * @param city 城市名称（可选，用于更精确的搜索）
 * @returns 图片URL
 */
export async function getAttractionImage(attractionName: string, city?: string): Promise<string> {
  // 构建搜索关键词
  const query = city ? `${attractionName} ${city}` : attractionName

  // 检查缓存
  const cached = getFromCache(query)
  if (cached) {
    return cached
  }

  // 依次尝试各个图片源
  for (const source of imageSources) {
    try {
      const url = await source.search(query)
      if (url) {
        // 存入缓存
        setCache(query, url)
        log.info(`Image found from ${source.name}: ${query}`)
        return url
      }
    }
    catch (error) {
      console.error(`Failed to search ${source.name}:`, error)
      continue
    }
  }

  // 所有源都失败，返回默认图片
  console.warn(`No image found for: ${query}`)
  return getDefaultImage(attractionName)
}

/**
 * 获取缓存统计
 */
export function getCacheStats(): { hitRate: number, size: number } {
  return {
    hitRate: 0, // TODO: 实现命中率统计
    size: imageCache.size,
  }
}

/**
 * 获取默认图片（基于景点类型）
 */
function getDefaultImage(attractionName: string): string {
  // 根据景点名称返回默认图片
  const defaults: Record<string, string> = {
    东方明珠: '/images/defaults/oriental-pearl.jpg',
    兵马俑: '/images/defaults/terracotta-army.jpg',
    外滩: '/images/defaults/the-bund.jpg',
    天坛: '/images/defaults/temple-of-heaven.jpg',
    故宫: '/images/defaults/forbidden-city.jpg',
    西湖: '/images/defaults/west-lake.jpg',
    长城: '/images/defaults/great-wall.jpg',
    颐和园: '/images/defaults/summer-palace.jpg',
  }

  // 检查是否匹配默认图片
  for (const [key, url] of Object.entries(defaults)) {
    if (attractionName.includes(key)) {
      return url
    }
  }

  // 通用默认图片
  return '/images/defaults/attraction.jpg'
}
