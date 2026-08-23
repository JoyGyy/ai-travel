/**
 * 用户登录 API
 */
import { NextResponse } from 'next/server'

import { login } from '@/lib/services/auth'
import { httpError, setAuthCookie, withPublicPost } from '@/lib/utils/http'

export const POST = withPublicPost('auth-login', 10, 60_000, async (req) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })
  // login() 对凭证错误抛的是普通 Error，默认会映射成 500；这里转成 401。
  let result: Awaited<ReturnType<typeof login>>
  try {
    result = await login(body.username, body.password)
  }
  catch (err) {
    if (err instanceof Error && err.message === '用户名或密码错误')
      throw httpError(401, '用户名或密码错误')
    if (err instanceof Error && err.message === '用户名和密码不能为空')
      throw httpError(400, '用户名和密码不能为空')
    throw err
  }

  const response = NextResponse.json({ success: true, ...result })
  setAuthCookie(response, result.token)

  return response
})
