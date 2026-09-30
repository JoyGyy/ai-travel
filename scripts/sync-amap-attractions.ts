/**
 * 命令行工具：调用高德地图 Web 服务 POI 批量同步旅游景点
 *
 * 用法示例：
 *   # 同步单个城市前 20 个热门景点预览
 *   pnpm exec tsx --env-file=.env scripts/sync-amap-attractions.ts --city 杭州 --limit 20 --dry-run
 *
 *   # 同步核心热门旅游城市（杭州、成都、三亚、西安、北京、上海等）
 *   pnpm exec tsx --env-file=.env scripts/sync-amap-attractions.ts --all --limit 15
 */

import { batchSyncAmapCities } from '../src/lib/services/amapAttractionSync'

const DEFAULT_POPULAR_CITIES = ['杭州', '成都', '三亚', '西安', '北京', '上海', '丽江', '重庆']

async function main() {
  const args = process.argv.slice(2)
  const isAll = args.includes('--all')
  const isDryRun = args.includes('--dry-run')

  const cityIdx = args.indexOf('--city')
  const city = cityIdx !== -1 && args[cityIdx + 1] ? args[cityIdx + 1] : undefined

  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 && args[limitIdx + 1] ? Number.parseInt(args[limitIdx + 1]!, 10) : 15

  console.log('🚀 启动高德地图 POI 景点批量同步服务...')

  if (!isAll && !city) {
    console.log(`
ℹ️ 使用说明:
  --city <城市名>    指定单个城市 (例如: --city 杭州)
  --all              同步默认核心旅游城市群 (${DEFAULT_POPULAR_CITIES.join(', ')})
  --limit <数量>     每个城市拉取的景点数量 (默认 15, 最大 50)
  --dry-run          仅在控制台打印提取预览，不写入存储
    `)
    process.exit(0)
  }

  const citiesToSync = isAll ? DEFAULT_POPULAR_CITIES : [city!]

  console.log(`📍 目标城市: ${citiesToSync.join(', ')} | 每城市上限: ${limit}`)

  const startTime = Date.now()
  const { errors, results, totalCount } = await batchSyncAmapCities({
    cities: citiesToSync,
    limitPerCity: limit,
  })

  for (const [cityName, spots] of Object.entries(results)) {
    console.log(`\n========================================`)
    console.log(`🏙️  城市: ${cityName} (共抓取到 ${spots.length} 个高德权威景点)`)
    console.log(`========================================`)

    spots.slice(0, 5).forEach((spot, idx) => {
      console.log(`  [${idx + 1}] ${spot.name}`)
      console.log(`      🏷️ 标签: ${spot.tags.join(' | ')}`)
      console.log(`      📍 地址: ${spot.address}`)
      console.log(`      🎫 门票: ${spot.priceText} (${spot.ticketType})`)
      console.log(`      🔗 携程联盟直达: ${spot.bookingLinks.ctrip}`)
    })

    if (spots.length > 5) {
      console.log(`      ... 以及另外 ${spots.length - 5} 个景点`)
    }
  }

  if (errors.length > 0) {
    console.warn(`\n⚠️ 部分城市拉取发生告警:`)
    errors.forEach(e => console.warn(`  - ${e.city}: ${e.error}`))
  }

  console.log(`\n✨ 抓取完成！共累计成功解析 ${totalCount} 个权威旅游景点，耗时 ${Date.now() - startTime}ms`)

  if (isDryRun) {
    console.log('ℹ️ 当前为 --dry-run 模式，未执行持久化存储。')
  }
}

main().catch(err => {
  console.error('❌ 执行发生致命异常:', err)
  process.exit(1)
})
