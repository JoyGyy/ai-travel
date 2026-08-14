/**
 * 获取当前用户信息 API
 */
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { users } from '@/db/schema'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/utils/http'

export const GET = withAuth(async (req, { user }) => {
  // 验证用户仍存在于数据库
  const result = await db
    .select({ createdAt: users.createdAt, id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, user.id))

  if (result.length === 0) {
    return NextResponse.json({ message: '用户不存在', success: false }, { status: 401 })
  }

  const dbUser = result[0]
  return NextResponse.json({
    success: true,
    user: {
      createdAt: dbUser.createdAt.toISOString(),
      id: dbUser.id,
      username: dbUser.username,
    },
  })
})
