/**
 * 结构化日志工具
 * 带时间戳和模块标签，便于后续替换为 pino/winston 等专业日志库
 */

const LEVEL_LABELS: Record<string, string> = {
  debug: 'DEBUG',
  info: ' INFO',
  warn: ' WARN',
  error: 'ERROR',
}

export interface Logger {
  debug(message: string, ...args: unknown[]): void
  info(message: string, ...args: unknown[]): void
  warn(message: string, ...args: unknown[]): void
  error(message: string, ...args: unknown[]): void
}

function formatTime(): string {
  return new Date().toISOString()
}

function createLogger(module: string): Logger {
  return {
    debug(message: string, ...args: unknown[]) {
      if (process.env.NODE_ENV === 'production') return
      console.debug(`[${formatTime()}] [${LEVEL_LABELS.debug}] [${module}] ${message}`, ...args)
    },
    info(message: string, ...args: unknown[]) {
      console.log(`[${formatTime()}] [${LEVEL_LABELS.info}] [${module}] ${message}`, ...args)
    },
    warn(message: string, ...args: unknown[]) {
      console.warn(`[${formatTime()}] [${LEVEL_LABELS.warn}] [${module}] ${message}`, ...args)
    },
    error(message: string, ...args: unknown[]) {
      console.error(`[${formatTime()}] [${LEVEL_LABELS.error}] [${module}] ${message}`, ...args)
    },
  }
}

export { createLogger }
