import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import { env } from '@/lib/env';

const siliconflow = createOpenAICompatible({
  apiKey: env.SILICONFLOW_API_KEY,
  baseURL: env.SILICONFLOW_BASE_URL,
  name: 'siliconflow',
});

export function getTravelModel(modelName?: string) {
  if (!env.SILICONFLOW_API_KEY) {
    throw new Error('未配置可用的 AI 模型，请设置 SILICONFLOW_API_KEY');
  }

  if (modelName === 'fallback') {
    return siliconflow(env.SILICONFLOW_FALLBACK_MODEL || env.SILICONFLOW_MODEL);
  }

  if (modelName && modelName !== 'siliconflow' && modelName !== 'primary') {
    return siliconflow(modelName);
  }

  return siliconflow(env.SILICONFLOW_MODEL);
}

export function getFallbackTravelModel() {
  return getTravelModel('fallback');
}

export { siliconflow };
