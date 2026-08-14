/**
 * 结构化日志工具
 * 带时间戳和模块标签，便于后续替换为 pino/winston 等专业日志库
 */
import process from 'node:process'

const LEVEL_LABELS: Record<string, string> = {
  debug: 'DEBUG',
  error: 'ERROR',
  info: ' INFO',
  warn: ' WARN',
}

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
}

export function createLogger(module: string): Logger {
  return {
    debug(message: string, ...args: unknown[]) {
      if (process.env.NODE_ENV === 'production') return
      console.warn(`[${formatTime()}] [${LEVEL_LABELS.debug}] [${module}] ${message}`, ...args)
    },
    error(message: string, ...args: unknown[]) {
      console.error(`[${formatTime()}] [${LEVEL_LABELS.error}] [${module}] ${message}`, ...args)
    },
    info(message: string, ...args: unknown[]) {
      console.warn(`[${formatTime()}] [${LEVEL_LABELS.info}] [${module}] ${message}`, ...args)
    },
    warn(message: string, ...args: unknown[]) {
      console.warn(`[${formatTime()}] [${LEVEL_LABELS.warn}] [${module}] ${message}`, ...args)
    },
  }
}

function formatTime(): string {
  return new Date().toISOString()
}
