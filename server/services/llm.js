/**
 * LLM 服务封装
 * 支持 DeepSeek / SiliconFlow API 真实调用，无 key 时降级为 Mock
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const SF_API_KEY = process.env.SILICONFLOW_API_KEY || ''
const SF_BASE_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'
const SF_MODEL = process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct'

/**
 * 获取可用的 LLM 配置（优先 DeepSeek）
 */
function getLLMConfig() {
  if (DEEPSEEK_API_KEY) {
    return { baseUrl: DEEPSEEK_BASE_URL, apiKey: DEEPSEEK_API_KEY, model: DEEPSEEK_MODEL }
  }
  if (SF_API_KEY) {
    return { baseUrl: SF_BASE_URL, apiKey: SF_API_KEY, model: SF_MODEL }
  }
  return null
}

/**
 * 调用 LLM 生成内容
 */
async function callLLM(systemPrompt, userPrompt) {
  const config = getLLMConfig()
  if (!config) return ''

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM API 调用失败: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * 流式调用 LLM
 */
async function callLLMStream(systemPrompt, userPrompt, onChunk) {
  const config = getLLMConfig()
  if (!config) return ''

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`LLM API 调用失败: ${response.status}`)
  }

  let fullContent = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const chunk = decoder.decode(value)
    const lines = chunk.split('\n')

    for (const line of lines) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const data = JSON.parse(line.slice(6))
          const content = data.choices?.[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onChunk(content)
          }
        }
        catch {
          // 忽略解析错误
        }
      }
    }
  }

  return fullContent
}

module.exports = { callLLM, callLLMStream }
