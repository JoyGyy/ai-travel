/**
 * 天气查询 API
 * GET /api/weather?city=北京
 */
import { NextResponse } from 'next/server'

import { getWeather } from '@/lib/services/weather'
import { errorResponse, httpError } from '@/lib/utils/http'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const city = searchParams.get('city')?.trim()

    if (!city || city.length > 50) {
      throw httpError(400, '请提供有效的城市名称')
    }

    const weather = await getWeather(city)
    if (!weather) {
      throw httpError(404, '未找到该城市天气信息')
    }

    return NextResponse.json(weather)
  }
  catch (err) {
    return errorResponse(err)
  }
}
