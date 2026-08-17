/**
 * 更新景点图片脚本
 *
 * 使用图片服务批量更新景点数据中的图片URL
 *
 * 使用方法：
 * npx tsx scripts/update-attraction-images.ts
 */

import fs from 'node:fs'
import path from 'node:path'

import { getAttractionImage } from '../src/lib/image-service'

// 景点数据接口
interface Attraction {
  [key: string]: unknown
  city: string
  coverImage: string
  id: string
  name: string
}

// 延迟函数，避免API限流
function delay(ms: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function main() {
  console.log('开始更新景点图片...')

  // 读取景点数据
  const dataPath = path.join(__dirname, '../src/knowledge/attractions-product.json')
  const attractions: Attraction[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

  console.log(`共有 ${attractions.length} 个景点需要更新`)

  // 更新每个景点的图片
  const updatedAttractions: Attraction[] = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < attractions.length; i++) {
    const attraction = attractions[i]
    console.log(`[${i + 1}/${attractions.length}] 更新: ${attraction.name} (${attraction.city})`)

    try {
      // 获取新图片URL
      const newImageUrl = await getAttractionImage(attraction.name, attraction.city)

      // 更新景点数据
      updatedAttractions.push({
        ...attraction,
        coverImage: newImageUrl,
      })

      console.log(`  ✓ 成功: ${newImageUrl.substring(0, 80)}...`)
      successCount++

      // 避免API限流，等待1秒
      await delay(1000)
    }
    catch (error) {
      console.error(`  ✗ 失败: ${error}`)
      // 保留原图片URL
      updatedAttractions.push(attraction)
      failCount++
    }
  }

  // 保存更新后的数据
  const outputPath = path.join(__dirname, '../src/knowledge/attractions-product.json')
  fs.writeFileSync(outputPath, JSON.stringify(updatedAttractions, null, 2), 'utf-8')

  console.log('\n更新完成！')
  console.log(`成功: ${successCount}`)
  console.log(`失败: ${failCount}`)
  console.log(`输出文件: ${outputPath}`)
}

// 运行脚本
main().catch(console.error)
