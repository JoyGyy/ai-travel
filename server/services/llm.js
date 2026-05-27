/**
 * LLM 服务封装
 * 支持 Mock 模式和 SiliconFlow API 真实调用
 */

// 是否使用真实 LLM API（通过环境变量控制）
const USE_REAL_LLM = process.env.USE_REAL_LLM === 'true'
const SILICONFLOW_API_KEY = process.env.SILICONFLOW_API_KEY || ''
const LLM_MODEL = process.env.LLM_MODEL || 'Qwen/Qwen2.5-7B-Instruct'

/**
 * 调用 LLM 生成内容
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @returns {Promise<string>} LLM 返回的文本
 */
async function callLLM(systemPrompt, userPrompt) {
  if (USE_REAL_LLM && SILICONFLOW_API_KEY) {
    return await callSiliconFlow(systemPrompt, userPrompt)
  }
  // Mock 模式：返回空字符串，由调用方自行处理
  return ''
}

/**
 * 调用 SiliconFlow API
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @returns {Promise<string>} LLM 返回的文本
 */
async function callSiliconFlow(systemPrompt, userPrompt) {
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
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
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @param {(chunk: string) => void} onChunk - 收到数据块时的回调
 * @returns {Promise<string>} 完整的回复内容
 */
async function callLLMStream(systemPrompt, userPrompt, onChunk) {
  if (USE_REAL_LLM && SILICONFLOW_API_KEY) {
    return await callSiliconFlowStream(systemPrompt, userPrompt, onChunk)
  }
  return ''
}

/**
 * 流式调用 SiliconFlow API
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @param {(chunk: string) => void} onChunk - 收到数据块时的回调
 * @returns {Promise<string>} 完整的回复内容
 */
async function callSiliconFlowStream(systemPrompt, userPrompt, onChunk) {
  const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SILICONFLOW_API_KEY}`,
    },
    body: JSON.stringify({
      model: LLM_MODEL,
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
