import { createOpenAICompatible } from '@ai-sdk/openai-compatible'

import { env } from '@/lib/env'

const siliconflow = createOpenAICompatible({
  apiKey: env.SILICONFLOW_API_KEY,
  baseURL: env.SILICONFLOW_BASE_URL,
  name: 'siliconflow',
})

export function getTravelModel(
  modelName?: string,
  customModel?: { apiKey?: string, baseUrl?: string, model?: string },
) {
  // 自定义模型：动态创建 provider
  if (modelName?.startsWith('custom-') && customModel?.baseUrl && customModel?.model) {
    const provider = createOpenAICompatible({
      apiKey: customModel.apiKey || 'no-key',
      baseURL: customModel.baseUrl,
      name: 'custom',
    })
    return provider(customModel.model)
  }

  // 内置模型仅保留硅基流动
  if (modelName === 'siliconflow' && env.SILICONFLOW_API_KEY) {
    return siliconflow(env.SILICONFLOW_MODEL)
  }

  if (env.SILICONFLOW_API_KEY)
    return siliconflow(env.SILICONFLOW_MODEL)
  throw new Error('未配置可用的 AI 模型，请设置 SILICONFLOW_API_KEY')
}

export { siliconflow }
