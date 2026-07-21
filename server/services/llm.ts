/**
 * LLM 服务封装
 * 支持 DeepSeek / SiliconFlow API，含 function calling
 */
import type { LLMProviderConfig } from '../config/env.js'

import { env, getLLMProviders } from '../config/env.js'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content?: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
  name?: string
}

export interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface LLMToolResponse {
  role: 'assistant'
  content: string | null
  tool_calls?: ToolCall[]
}

/** 获取第一个可用的 LLM 提供商配置 */
function getLLMConfig(): LLMProviderConfig | null {
  return getLLMProviders()[0] || null
}

/** 创建带超时的 AbortController，用于请求取消 */
function createTimeout(ms: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { controller, timeout }
}

/** 统一的 Chat Completions API 请求封装 */
async function fetchChatCompletion(config: LLMProviderConfig, body: Record<string, unknown>, signal: AbortSignal) {
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

/** 非流式调用 LLM，返回完整响应文本 */
async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
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

    const data = await response.json() as { choices?: { message?: { content?: string } }[] }
    return data.choices?.[0]?.message?.content || ''
  }
  finally {
    clearTimeout(timeout)
  }
}

/** 流式调用 LLM，逐块回调并返回拼接后的完整内容 */
async function callLLMStream(systemPrompt: string, userPrompt: string, onChunk: (content: string) => void): Promise<string> {
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
    const reader = response.body!.getReader()
    const decoder = new TextDecoder('utf-8')
    let remainder = ''

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
            const content = (JSON.parse(line.slice(6)) as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content || ''
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

/** 支持 function calling 的 LLM 调用，返回助手消息（可能包含 tool_calls） */
async function callLLMWithTools(messages: ChatMessage[], tools: ToolDefinition[]): Promise<LLMToolResponse | null> {
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

    const data = await response.json() as { choices?: { message?: LLMToolResponse }[] }
    return data.choices?.[0]?.message || null
  }
  finally {
    clearTimeout(timeout)
  }
}

export { callLLM, callLLMStream, callLLMWithTools, getLLMConfig }
