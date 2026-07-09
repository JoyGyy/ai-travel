/**
 * LLM 服务封装
 * 支持 DeepSeek / SiliconFlow API，含 function calling
 */

import { env, getLLMProviders } from '../config/env.js'

function getLLMConfig() {
  return getLLMProviders()[0] || null
}

function createTimeout(ms) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { controller, timeout }
}

async function fetchChatCompletion(config, body, signal) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({ model: config.model, ...body }),
    signal,
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`LLM API 调用失败: ${response.status} ${errText}`)
  }

  return response
}

/**
 * 调用 LLM（纯文本）
 */
async function callLLM(systemPrompt, userPrompt) {
  const config = getLLMConfig()
  if (!config)
    return ''

  const { controller, timeout } = createTimeout(env.LLM_TIMEOUT_MS)

  try {
    const response = await fetchChatCompletion(config, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    }, controller.signal)

    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  }
  finally {
    clearTimeout(timeout)
  }
}

/**
 * 流式调用 LLM
 */
async function callLLMStream(systemPrompt, userPrompt, onChunk) {
  const config = getLLMConfig()
  if (!config)
    return ''

  const { controller, timeout } = createTimeout(env.LLM_STREAM_TIMEOUT_MS)

  try {
    const response = await fetchChatCompletion(config, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true,
    }, controller.signal)

    let fullContent = ''
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8', { stream: true })
    let remainder = '' // 缓冲不完整的行

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        remainder += decoder.decode()
        break
      }

      const chunk = remainder + decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      remainder = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const content = JSON.parse(line.slice(6)).choices?.[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              onChunk(content)
            }
          }
          catch { /* 忽略解析错误 */ }
        }
      }
    }
    return fullContent
  }
  finally {
    clearTimeout(timeout)
  }
}

/**
 * 调用 LLM（支持 function calling）
 * @param {object[]} messages - 对话历史
 * @param {object[]} tools - 工具定义
 * @returns {object|null} LLM 响应消息
 */
async function callLLMWithTools(messages, tools) {
  const config = getLLMConfig()
  if (!config)
    return null

  const { controller, timeout } = createTimeout(env.LLM_TIMEOUT_MS)

  try {
    const response = await fetchChatCompletion(config, {
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 4096,
    }, controller.signal)

    const data = await response.json()
    return data.choices?.[0]?.message || null
  }
  finally {
    clearTimeout(timeout)
  }
}

export { callLLM, callLLMStream, callLLMWithTools, getLLMConfig }
