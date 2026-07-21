/**
 * 结构化日志工具
 * 带时间戳和模块标签，便于后续替换为 pino/winston 等专业日志库
 */

const LEVEL_LABELS = {
  debug: 'DEBUG',
  info: ' INFO',
  warn: ' WARN',
  error: 'ERROR',
}

function formatTime() {
  return new Date().toISOString()
}

function createLogger(module) {
  return {
    debug(message, ...args) {
      if (process.env.NODE_ENV === 'production') return
      console.debug(`[${formatTime()}] [${LEVEL_LABELS.debug}] [${module}] ${message}`, ...args)
    },
    info(message, ...args) {
      console.log(`[${formatTime()}] [${LEVEL_LABELS.info}] [${module}] ${message}`, ...args)
    },
    warn(message, ...args) {
      console.warn(`[${formatTime()}] [${LEVEL_LABELS.warn}] [${module}] ${message}`, ...args)
    },
    error(message, ...args) {
      console.error(`[${formatTime()}] [${LEVEL_LABELS.error}] [${module}] ${message}`, ...args)
    },
  }
}

export { createLogger }
