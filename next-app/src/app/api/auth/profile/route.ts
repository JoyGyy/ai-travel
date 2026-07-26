/**
 * 获取个人资料 API（含 AI 额度和收藏列表）
 */
import { NextResponse } from 'next/server'

import { getAuthFromHeaders, getProfile } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function GET(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    const profile = await getProfile(user.id)
    return NextResponse.json({ success: true, profile })
  }
  catch (err) {
    return errorResponse(err)
  }
}
