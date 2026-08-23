/**
 * 城市搜索API
 * GET /api/cities?keyword=北京&subdistrict=0
 *
 * 接入高德地图行政区域查询API
 * 如果未配置 AMAP_API_KEY，返回本地城市列表
 */
import { NextResponse } from 'next/server'

import { searchCities } from '@/lib/services/cityService'
import { withRateLimit } from '@/lib/utils/http'
import { readPositiveInteger } from '@/lib/utils/validation'

export const GET = withRateLimit('cities:read', 60, 60_000, async (request) => {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')?.trim() || ''
  const subdistrict = readPositiveInteger(searchParams.get('subdistrict') || '0', '子级数量', {
    max: 5,
    min: 0,
  })

  // 无关键字时返回空数组（避免返回过多数据）
  if (!keyword || keyword.length < 1) {
    return NextResponse.json({ data: [], success: true })
  }

  // 尝试调用高德API
  const amapResults = await searchCities(keyword, subdistrict)

  if (amapResults.length > 0) {
    // 高德API返回结果
    return NextResponse.json({
      data: amapResults.slice(0, 20), // 限制返回数量
      source: 'amap',
      success: true,
    })
  }

  // 无结果时直接返回空数组
  return NextResponse.json({
    data: [],
    source: 'amap',
    success: true,
  })
})
