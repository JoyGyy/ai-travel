import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

import { env } from '@/lib/env'

const siliconflow = createOpenAICompatible({
  apiKey: env.SILICONFLOW_API_KEY,
  baseURL: env.SILICONFLOW_BASE_URL,
  name: 'siliconflow',
})

const deepseek = createOpenAICompatible({
  apiKey: env.DEEPSEEK_API_KEY,
  baseURL: env.DEEPSEEK_BASE_URL,
  name: 'deepseek',
})

export function getTravelModel() {
  if (env.DEEPSEEK_API_KEY)
    return deepseek(env.DEEPSEEK_MODEL)
  if (env.SILICONFLOW_API_KEY)
    return siliconflow(env.SILICONFLOW_MODEL)
  throw new Error('未配置可用的 AI 模型，请设置 DEEPSEEK_API_KEY 或 SILICONFLOW_API_KEY')
}

export { deepseek, siliconflow }
