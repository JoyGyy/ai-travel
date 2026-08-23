import { createLogger } from '@/lib/utils/logger'

const log = createLogger('ai')

interface AiRequestEvent {
  operation: 'chat' | 'recommend'
  requestId: string
}

interface AiFinishEvent extends AiRequestEvent {
  durationMs: number
  finishReason: unknown
  steps?: unknown
  totalUsage: unknown
}

export function logAiRequest({ operation, requestId }: AiRequestEvent): number {
  log.info('AI 请求开始', { operation, requestId })
  return Date.now()
}

export function logAiFinish(event: AiFinishEvent): void {
  const usage = getUsage(event.totalUsage)
  log.info('AI 请求完成', {
    durationMs: event.durationMs,
    finishReason: String(event.finishReason),
    operation: event.operation,
    requestId: event.requestId,
    tools: getToolNames(event.steps),
    ...usage,
  })
}

function getUsage(value: unknown): Record<string, number> {
  if (!isRecord(value))
    return {}

  const usage: Record<string, number> = {}
  for (const key of ['inputTokens', 'outputTokens', 'totalTokens']) {
    if (typeof value[key] === 'number')
      usage[key] = value[key]
  }
  return usage
}

function getToolNames(steps: unknown): string[] {
  if (!Array.isArray(steps))
    return []

  const tools = new Set<string>()
  for (const step of steps) {
    if (!isRecord(step) || !Array.isArray(step.toolCalls))
      continue
    for (const toolCall of step.toolCalls) {
      if (isRecord(toolCall) && typeof toolCall.toolName === 'string')
        tools.add(toolCall.toolName)
    }
  }
  return [...tools]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
