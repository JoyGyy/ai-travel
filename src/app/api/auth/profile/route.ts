/**
 * 获取个人资料 API（含 AI 额度和收藏列表）
 */
import { NextResponse } from 'next/server'

import { getProfile } from '@/lib/services/auth'
import { withAuth } from '@/lib/utils/http'

export const GET = withAuth(async (req, { user }) => {
  const profile = await getProfile(user.id)
  return NextResponse.json({ profile, success: true })
})
