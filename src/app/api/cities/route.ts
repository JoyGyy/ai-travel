/**
 * 城市搜索API
 * GET /api/cities?keyword=北京&subdistrict=0
 *
 * 接入高德地图行政区域查询API
 * 如果未配置 AMAP_API_KEY，返回本地城市列表
 */
import { NextResponse } from 'next/server'

import { allCities } from '@/constants/cities'
import { searchCities } from '@/lib/services/cityService'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')?.trim() || ''
  const subdistrict = Number(searchParams.get('subdistrict')) || 0

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

  // 降级：使用本地城市列表过滤
  const localResults = allCities
    .filter(city => city.includes(keyword))
    .slice(0, 20)
    .map(name => ({
      adcode: '',
      level: 'city',
      name,
    }))

  return NextResponse.json({
    data: localResults,
    source: 'local',
    success: true,
  })
}
