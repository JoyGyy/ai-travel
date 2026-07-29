export interface NormalizedAIError {
  status: number
  message: string
}

export function normalizeAIError(error: unknown): NormalizedAIError {
  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return { status: 499, message: 'AI 请求已取消' }
    }
    return { status: 500, message: error.message || 'AI 服务暂时不可用' }
  }

  return { status: 500, message: 'AI 服务暂时不可用' }
}
