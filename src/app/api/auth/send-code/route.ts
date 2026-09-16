/**
 * 发送邮箱验证码 API
 * POST /api/auth/send-code
 */
import { NextResponse } from 'next/server'

import { query } from '@/lib/db'
import { generateVerificationCode, saveVerificationCode, sendVerificationCodeEmail } from '@/lib/services/email'
import { httpError, withPublicPost } from '@/lib/utils/http'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const POST = withPublicPost('auth-send-code', 5, 60_000, async (req) => {
  const body = await req.json().catch(() => {
    throw httpError(400, '请求格式无效')
  })

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const type = body.type === 'reset_password' ? 'reset_password' : 'register'

  if (!email || !EMAIL_REGEX.test(email)) {
    throw httpError(400, '请输入有效的邮箱地址')
  }

  // 注册场景：检查邮箱是否已被占用
  if (type === 'register') {
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      throw httpError(400, '该邮箱已被注册，请直接登录')
    }
  }

  const code = generateVerificationCode()
  await saveVerificationCode(email, code, type)
  await sendVerificationCodeEmail(email, code, type)

  return NextResponse.json({
    message: '验证码已发送至您的邮箱，10 分钟内有效',
    success: true,
  })
})
