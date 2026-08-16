/**
 * 获取当前用户信息 API
 */
import { NextResponse } from 'next/server'

import { query } from '@/lib/db'
import { withAuth } from '@/lib/utils/http'

export const GET = withAuth(async (req, { user }) => {
  // 验证用户仍存在于数据库
  const result = await query('SELECT id, username, created_at FROM users WHERE id = $1', [user.id])

  if (result.rows.length === 0) {
    return NextResponse.json({ message: '用户不存在', success: false }, { status: 401 })
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
})
