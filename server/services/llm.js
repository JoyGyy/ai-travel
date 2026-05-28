/**
 * LLM 服务封装
 * 支持 DeepSeek / SiliconFlow API，含 function calling
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1'
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const SF_API_KEY = process.env.SILICONFLOW_API_KEY || ''
const SF_BASE_URL = process.env.SILICONFLOW_BASE_URL || 'https://api.siliconflow.cn/v1'
const SF_MODEL = process.env.SILICONFLOW_MODEL || 'Qwen/Qwen2.5-7B-Instruct'

function getLLMConfig() {
  if (DEEPSEEK_API_KEY) return { baseUrl: DEEPSEEK_BASE_URL, apiKey: DEEPSEEK_API_KEY, model: DEEPSEEK_MODEL }
  if (SF_API_KEY) return { baseUrl: SF_BASE_URL, apiKey: SF_API_KEY, model: SF_MODEL }
  return null
}

/**
 * 调用 LLM（纯文本）
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

  if (!response.ok) throw new Error(`LLM API 调用失败: ${response.status}`)
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

  if (!response.ok) throw new Error(`LLM API 流式调用失败: ${response.status}`)

  let fullContent = ''
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ') && line !== 'data: [DONE]') {
        try {
          const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''
          if (content) {
            fullContent += content
            onChunk(content)
          }
        }
        catch { /* 忽略 */ }
      }
    }
  }
  return fullContent
}

/**
 * 调用 LLM（支持 function calling）
 * @param {object[]} messages - 对话历史
 * @param {object[]} tools - 工具定义
 * @returns {object|null} LLM 响应消息
 */
async function callLLMWithTools(messages, tools) {
  const config = getLLMConfig()
  if (!config) return null

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`LLM API 调用失败: ${response.status} ${errText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message || null
}

module.exports = { callLLM, callLLMStream, callLLMWithTools, getLLMConfig }
