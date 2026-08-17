/**
 * 图片服务测试 API
 * GET /api/images/test?query=故宫&city=北京
 */

import type { NextRequest } from 'next/server'

import { NextResponse } from 'next/server'

import { batchGetAttractionImages, getAttractionImage, getCacheStats } from '@/lib/image-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const city = searchParams.get('city')
  const batch = searchParams.get('batch')

  // 批量测试模式
  if (batch === 'true') {
    const testAttractions = [
      { city: '北京', name: '故宫' },
      { city: '北京', name: '长城' },
      { city: '北京', name: '天坛' },
      { city: '上海', name: '外滩' },
      { city: '上海', name: '东方明珠' },
      { city: '杭州', name: '西湖' },
      { city: '西安', name: '兵马俑' },
    ]

    try {
      const results = await batchGetAttractionImages(testAttractions)
      const cacheStats = getCacheStats()

      return NextResponse.json({
        cache: cacheStats,
        data: Object.fromEntries(results),
        message: `成功获取 ${results.size} 个景点图片`,
        success: true,
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        },
        { status: 500 },
      )
    }
  }

  // 单个查询模式
  if (!query) {
    return NextResponse.json(
      {
        error: '缺少 query 参数',
        success: false,
      },
      { status: 400 },
    )
  }

  try {
    const imageUrl = await getAttractionImage(query, city || undefined)
    const cacheStats = getCacheStats()

    return NextResponse.json({
      cache: cacheStats,
      data: {
        city,
        imageUrl,
        query,
      },
      success: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 },
    )
  }
}
