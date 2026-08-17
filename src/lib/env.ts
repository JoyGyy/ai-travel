/**
 * 环境变量配置
 * Next.js 自动加载 .env 文件，此处提供统一的读取和校验
 */

// ========== 类型定义 ==========

export interface LLMProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
  name: string
}

// ========== 默认值常量 ==========

const DEFAULT_SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'
const DEFAULT_SILICONFLOW_MODEL = 'Qwen/Qwen2.5-7B-Instruct'
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat'
const MIN_JWT_SECRET_LENGTH = 32

// ========== 环境变量读取工具函数 ==========

export interface EnvConfig {
  ADMIN_USERS: string
  DATABASE_URL: string
  DEEPSEEK_API_KEY: string
  DEEPSEEK_BASE_URL: string
  DEEPSEEK_MODEL: string
  IMAGE_BASE_URL: string
  IS_PRODUCTION: boolean
  JWT_SECRET: string
  LLM_STREAM_TIMEOUT_MS: number
  LLM_TIMEOUT_MS: number
  NODE_ENV: string
  SILICONFLOW_API_KEY: string
  SILICONFLOW_BASE_URL: string
  SILICONFLOW_MODEL: string
}

function readNumber(name: string, fallback: number): number {
  const raw = readString(name)
  if (!raw)
    return fallback

  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} 必须是大于 0 的数字`)
  }
  return value
}

// ========== 统一配置对象 ==========

function readString(name: string, fallback = ''): string {
  return process.env[name]?.trim() || fallback
}

const env: EnvConfig = {
  ADMIN_USERS: readString('ADMIN_USERS'),
  DATABASE_URL: readString('DATABASE_URL'),
  DEEPSEEK_API_KEY: readString('DEEPSEEK_API_KEY'),
  DEEPSEEK_BASE_URL: readString('DEEPSEEK_BASE_URL', DEFAULT_DEEPSEEK_BASE_URL),
  DEEPSEEK_MODEL: readString('DEEPSEEK_MODEL', DEFAULT_DEEPSEEK_MODEL),
  IMAGE_BASE_URL: readString('IMAGE_BASE_URL'),
  IS_PRODUCTION: false,
  JWT_SECRET: readString('JWT_SECRET'),
  LLM_STREAM_TIMEOUT_MS: readNumber('LLM_STREAM_TIMEOUT_MS', 120_000),
  LLM_TIMEOUT_MS: readNumber('LLM_TIMEOUT_MS', 60_000),
  NODE_ENV: readString('NODE_ENV', 'development'),
  SILICONFLOW_API_KEY: readString('SILICONFLOW_API_KEY'),
  SILICONFLOW_BASE_URL: readString('SILICONFLOW_BASE_URL', DEFAULT_SILICONFLOW_BASE_URL),
  SILICONFLOW_MODEL: readString('SILICONFLOW_MODEL', DEFAULT_SILICONFLOW_MODEL),
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
  if (
    env.DATABASE_URL
    && !env.DATABASE_URL.startsWith('postgresql://')
    && !env.DATABASE_URL.startsWith('postgres://')
  ) {
    throw new Error('DATABASE_URL 必须以 postgresql:// 或 postgres:// 开头')
  }
}

// 仅在服务端运行时执行校验（构建时跳过）
if (typeof window === 'undefined' && process.env.NODE_ENV !== undefined) {
  try {
    validateEnv()
  }
  catch (err) {
    // 生产环境必须通过校验，否则阻止启动
    if (env.IS_PRODUCTION) {
      throw err
    }
    // 开发/构建时仅打印警告
    console.warn('[env] 环境变量校验:', (err as Error).message)
  }
}

// ========== LLM 提供商 ==========

/** 根据配置返回已启用的 LLM 提供商列表（按优先级排序） */
export function getLLMProviders(): LLMProviderConfig[] {
  const providers: LLMProviderConfig[] = []
  if (env.SILICONFLOW_API_KEY) {
    providers.push({
      apiKey: env.SILICONFLOW_API_KEY,
      baseUrl: env.SILICONFLOW_BASE_URL,
      model: env.SILICONFLOW_MODEL,
      name: 'SiliconFlow',
    })
  }
  if (env.DEEPSEEK_API_KEY) {
    providers.push({
      apiKey: env.DEEPSEEK_API_KEY,
      baseUrl: env.DEEPSEEK_BASE_URL,
      model: env.DEEPSEEK_MODEL,
      name: 'DeepSeek',
    })
  }
  return providers
}

export { env }
