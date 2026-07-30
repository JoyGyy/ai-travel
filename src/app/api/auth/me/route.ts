/**
 * 获取当前用户信息 API
 */
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

import { users } from '@/db/schema'
import { db } from '@/lib/db'
import { getAuthFromHeaders } from '@/lib/services/auth'
import { errorResponse } from '@/lib/utils/http'

export async function GET(req: Request) {
  try {
    const user = getAuthFromHeaders(req.headers)
    if (!user) {
      return NextResponse.json({ success: false, message: '未登录' }, { status: 401 })
    }

    // 验证用户仍存在于数据库
    const result = await db
      .select({ id: users.id, username: users.username, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, user.id))

    if (result.length === 0) {
      return NextResponse.json({ success: false, message: '用户不存在' }, { status: 401 })
    }

    const dbUser = result[0]
    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        username: dbUser.username,
        createdAt: dbUser.createdAt.toISOString(),
      },
    })
  }
  catch (err) {
    return errorResponse(err)
  }
}
