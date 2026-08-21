import { NextResponse } from 'next/server'

import { env } from '@/lib/env'

/** 返回当前可用的 AI 模型配置（仅公开是否可用，不暴露 API Key） */
export async function GET() {
  const models = [
    {
      available: Boolean(env.SILICONFLOW_API_KEY),
      baseUrl: env.SILICONFLOW_BASE_URL,
      model: env.SILICONFLOW_MODEL,
      name: 'siliconflow',
    },
  ]

  return NextResponse.json({ models })
}
