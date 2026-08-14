export interface NormalizedAIError {
  message: string
  status: number
}

export function normalizeAIError(error: unknown): NormalizedAIError {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { message: 'AI 请求已取消', status: 499 }
    }
    return { message: error.message || 'AI 服务暂时不可用', status: 500 }
  }

  return { message: 'AI 服务暂时不可用', status: 500 }
}
