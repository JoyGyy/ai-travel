import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

import { env } from '@/lib/env'

const siliconflow = createOpenAICompatible({
  apiKey: env.SILICONFLOW_API_KEY,
  baseURL: env.SILICONFLOW_BASE_URL,
  name: 'siliconflow',
})

export function getTravelModel(modelName?: string) {
  if ((modelName === undefined || modelName === 'siliconflow') && env.SILICONFLOW_API_KEY) {
    return siliconflow(env.SILICONFLOW_MODEL)
  }

  if (env.SILICONFLOW_API_KEY)
    return siliconflow(env.SILICONFLOW_MODEL)
  throw new Error('未配置可用的 AI 模型，请设置 SILICONFLOW_API_KEY')
}

export { siliconflow }
