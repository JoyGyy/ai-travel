/**
 * 获取当前用户信息 API
 * 静默探测会话状态：已登录返回用户信息，未登录或失效返回 user: null，杜绝控制台抛 401 报错
 */
import { NextResponse } from 'next/server'

import { query } from '@/lib/db'
import { getAuthFromHeaders } from '@/lib/services/auth'

export async function GET(req: Request) {
  const user = await getAuthFromHeaders(req.headers)
  if (!user) {
    return NextResponse.json({ success: true, user: null })
  }

  // 验证用户仍存在于数据库
  const result = await query('SELECT id, username, created_at FROM users WHERE id = $1', [user.id])

  if (result.rows.length === 0) {
    const response = NextResponse.json({ success: true, user: null })
    response.cookies.delete('token')
    return response
  }

  const dbUser = result.rows[0]
  return NextResponse.json({
    success: true,
    user: {
      createdAt: dbUser.created_at.toISOString(),
      id: dbUser.id,
      username: dbUser.username,
    },
  })
}
