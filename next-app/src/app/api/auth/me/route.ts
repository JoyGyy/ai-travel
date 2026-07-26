/**
 * 获取当前用户信息 API
 */
import { NextResponse } from 'next/server'

import { query } from '@/lib/db'
import { getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function GET(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    // 验证用户仍存在于数据库
    const result = await query('SELECT id, username, created_at FROM users WHERE id = $1', [user.id])
    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 401 })
    }

    const dbUser = result.rows[0]
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        createdAt: dbUser.created_at,
      },
    })
  }
  catch (err) {
    return errorResponse(err)
  }
}
