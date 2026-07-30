/**
 * 环境变量配置
 * Next.js 自动加载 .env 文件，此处提供统一的读取和校验
 */

// ========== 类型定义 ==========

export interface LLMProviderConfig {
  name: string
  baseUrl: string
  apiKey: string
  model: string
}

// ========== 默认值常量 ==========

const DEFAULT_SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'
const DEFAULT_SILICONFLOW_MODEL = 'Qwen/Qwen2.5-7B-Instruct'
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat'
const MIN_JWT_SECRET_LENGTH = 32

// ========== 环境变量读取工具函数 ==========

function readString(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback
}

function readNumber(name: string, fallback: number): number {
  const raw = readString(name)
  if (!raw) return fallback

  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} 必须是大于 0 的数字`)
  }
  return value
}

// ========== 统一配置对象 ==========

export interface EnvConfig {
  NODE_ENV: string
  JWT_SECRET: string
  LLM_TIMEOUT_MS: number
  LLM_STREAM_TIMEOUT_MS: number
  SILICONFLOW_API_KEY: string
  SILICONFLOW_BASE_URL: string
  SILICONFLOW_MODEL: string
  DEEPSEEK_API_KEY: string
  DEEPSEEK_BASE_URL: string
  DEEPSEEK_MODEL: string
  DATABASE_URL: string
  ADMIN_USERS: string
  IS_PRODUCTION: boolean
  IMAGE_BASE_URL: string
}

const env: EnvConfig = {
  NODE_ENV: readString('NODE_ENV', 'development'),
  JWT_SECRET: readString('JWT_SECRET'),
  LLM_TIMEOUT_MS: readNumber('LLM_TIMEOUT_MS', 60_000),
  LLM_STREAM_TIMEOUT_MS: readNumber('LLM_STREAM_TIMEOUT_MS', 120_000),
  SILICONFLOW_API_KEY: readString('SILICONFLOW_API_KEY'),
  SILICONFLOW_BASE_URL: readString('SILICONFLOW_BASE_URL', DEFAULT_SILICONFLOW_BASE_URL),
  SILICONFLOW_MODEL: readString('SILICONFLOW_MODEL', DEFAULT_SILICONFLOW_MODEL),
  DEEPSEEK_API_KEY: readString('DEEPSEEK_API_KEY'),
  DEEPSEEK_BASE_URL: readString('DEEPSEEK_BASE_URL', DEFAULT_DEEPSEEK_BASE_URL),
  DEEPSEEK_MODEL: readString('DEEPSEEK_MODEL', DEFAULT_DEEPSEEK_MODEL),
  DATABASE_URL: readString('DATABASE_URL'),
  ADMIN_USERS: readString('ADMIN_USERS'),
  IS_PRODUCTION: false,
  IMAGE_BASE_URL: readString('IMAGE_BASE_URL'),
}

env.IS_PRODUCTION = env.NODE_ENV === 'production'

// ========== 配置校验（仅服务端执行） ==========

function validateEnv(): void {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET 环境变量未设置，请在 .env 中配置')
  }
  if (env.IS_PRODUCTION && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`生产环境 JWT_SECRET 长度至少需要 ${MIN_JWT_SECRET_LENGTH} 个字符`)
  }

  // DATABASE_URL 格式校验
  if (env.DATABASE_URL && !env.DATABASE_URL.startsWith('postgresql://') && !env.DATABASE_URL.startsWith('postgres://')) {
    throw new Error('DATABASE_URL 必须以 postgresql:// 或 postgres:// 开头')
  }
}

// 仅在服务端运行时执行校验（构建时跳过）
if (typeof window === 'undefined' && process.env.NODE_ENV !== undefined) {
  try {
    validateEnv()
  }
  catch (err) {
    // 构建时环境变量可能未配置，仅打印警告
    if (process.env.NODE_ENV === 'production') {
      console.warn('[env] 环境变量校验:', (err as Error).message)
    }
  }
}

// ========== LLM 提供商 ==========

/** 根据配置返回已启用的 LLM 提供商列表（按优先级排序） */
export function getLLMProviders(): LLMProviderConfig[] {
  const providers: LLMProviderConfig[] = []
  if (env.SILICONFLOW_API_KEY) {
    providers.push({
      name: 'SiliconFlow',
      baseUrl: env.SILICONFLOW_BASE_URL,
      apiKey: env.SILICONFLOW_API_KEY,
      model: env.SILICONFLOW_MODEL,
    })
  }
  if (env.DEEPSEEK_API_KEY) {
    providers.push({
      name: 'DeepSeek',
      baseUrl: env.DEEPSEEK_BASE_URL,
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL,
    })
  }
  return providers
}

export { env }
