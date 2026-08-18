/**
 * 批量获取景点图片脚本（高德POI版）
 *
 * 从高德地图POI搜索获取景点图片
 * 运行方式：npx tsx scripts/fetch-attraction-images.ts
 */

import { query } from '../src/lib/db'
import 'dotenv/config'

interface Attraction {
  city: string
  id: string
  name: string
}

interface AmapPOI {
  address: string
  cityname: string
  id: string
  location: string
  name: string
  photos?: Array<{ title: string, url: string }>
  type: string
}

async function getAttractions(): Promise<Attraction[]> {
  const result = await query(
    `SELECT id, name, city FROM attractions
     WHERE cover_image IS NULL
        OR cover_image = ''
        OR cover_image LIKE '/images/home/trip-%'
        OR cover_image LIKE '/images/defaults/%'
        OR cover_image LIKE 'https://images.pexels.com%'
     ORDER BY city, name`,
  )
  return result.rows
}

async function searchAmapPOI(name: string, city: string): Promise<AmapPOI | null> {
  const apiKey = process.env.AMAP_API_KEY
  if (!apiKey)
    return null

  try {
    const params = new URLSearchParams({
      key: apiKey,
      keywords: name,
      city,
      citylimit: 'true',
      extensions: 'all', // 获取详细信息包括图片
    })

    const response = await fetch(`https://restapi.amap.com/v3/place/text?${params}`)
    const data = await response.json()

    if (data.status === '1' && data.pois && data.pois.length > 0) {
      return data.pois[0]
    }
    return null
  }
  catch (error) {
    console.error('高德API搜索失败:', error)
    return null
  }
}

async function updateAttractionImage(id: string, imageUrl: string): Promise<void> {
  await query(
    'UPDATE attractions SET cover_image = $1, updated_at = NOW() WHERE id = $2',
    [imageUrl, id],
  )
}

async function main() {
  console.log('=== 景点图片批量获取工具（高德POI版）===\n')

  if (!process.env.AMAP_API_KEY) {
    console.error('错误：需要配置 AMAP_API_KEY')
    process.exit(1)
  }

  const attractions = await getAttractions()
  console.log(`找到 ${attractions.length} 个需要获取图片的景点\n`)

  if (attractions.length === 0) {
    console.log('所有景点已有图片')
    process.exit(0)
  }

  let success = 0
  let failed = 0
  let noPhoto = 0

  for (let i = 0; i < attractions.length; i++) {
    const attraction = attractions[i]
    const progress = `[${i + 1}/${attractions.length}]`

    console.log(`${progress} 获取 ${attraction.city} - ${attraction.name}...`)

    try {
      const poi = await searchAmapPOI(attraction.name, attraction.city)

      if (poi && poi.photos && poi.photos.length > 0) {
        // 获取第一张图片
        const imageUrl = poi.photos[0].url
        await updateAttractionImage(attraction.id, imageUrl)
        console.log(`  ✓ 已保存: ${imageUrl.substring(0, 70)}...`)
        success++
      }
      else {
        console.log(`  ⚠ POI无图片`)
        noPhoto++
      }
    }
    catch (error) {
      console.error(`  ✗ 获取失败:`, error)
      failed++
    }

    // 避免API限流
    if (i < attractions.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  console.log('\n=== 完成 ===')
  console.log(`成功: ${success}`)
  console.log(`无图片: ${noPhoto}`)
  console.log(`失败: ${failed}`)
  console.log(`总计: ${attractions.length}`)
}

main().catch(console.error)
