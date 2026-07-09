import path from 'node:path'
import { config } from 'dotenv'

config({ path: path.resolve(import.meta.dirname, '../../.env') })

const DEFAULT_CORS_ORIGINS = ['http://localhost:5181', 'http://localhost:3000']
const DEFAULT_SILICONFLOW_BASE_URL = 'https://api.siliconflow.cn/v1'
const DEFAULT_SILICONFLOW_MODEL = 'Qwen/Qwen2.5-7B-Instruct'
const DEFAULT_DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1'
const DEFAULT_DEEPSEEK_MODEL = 'deepseek-chat'
const MIN_JWT_SECRET_LENGTH = 32
const BODY_LIMIT_PATTERN = /^\d+(?:\.\d+)?(?:b|kb|mb)$/i

function readString(name, fallback = '') {
  return process.env[name]?.trim() || fallback
}

function readNumber(name, fallback) {
  const raw = readString(name)
  if (!raw)
    return fallback

  const value = Number(raw)
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} 必须是大于 0 的数字`)
  }
  return value
}

function readCorsOrigins() {
  const raw = readString('CORS_ORIGIN')
  if (!raw && process.env.NODE_ENV === 'production')
    return []
  if (!raw)
    return DEFAULT_CORS_ORIGINS
  return raw.split(',').map(item => item.trim()).filter(Boolean)
}

const env = {
  NODE_ENV: readString('NODE_ENV', 'development'),
  PORT: readNumber('PORT', 3030),
  JWT_SECRET: readString('JWT_SECRET'),
  CORS_ORIGINS: readCorsOrigins(),
  REQUEST_BODY_LIMIT: readString('REQUEST_BODY_LIMIT', '100kb').toLowerCase(),
  LLM_TIMEOUT_MS: readNumber('LLM_TIMEOUT_MS', 60_000),
  LLM_STREAM_TIMEOUT_MS: readNumber('LLM_STREAM_TIMEOUT_MS', 120_000),
  SILICONFLOW_API_KEY: readString('SILICONFLOW_API_KEY'),
  SILICONFLOW_BASE_URL: readString('SILICONFLOW_BASE_URL', DEFAULT_SILICONFLOW_BASE_URL),
  SILICONFLOW_MODEL: readString('SILICONFLOW_MODEL', DEFAULT_SILICONFLOW_MODEL),
  DEEPSEEK_API_KEY: readString('DEEPSEEK_API_KEY'),
  DEEPSEEK_BASE_URL: readString('DEEPSEEK_BASE_URL', DEFAULT_DEEPSEEK_BASE_URL),
  DEEPSEEK_MODEL: readString('DEEPSEEK_MODEL', DEFAULT_DEEPSEEK_MODEL),
}

env.IS_PRODUCTION = env.NODE_ENV === 'production'

function validateEnv() {
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET 环境变量未设置，请在 .env 中配置')
  }
  if (env.IS_PRODUCTION && env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`生产环境 JWT_SECRET 长度至少需要 ${MIN_JWT_SECRET_LENGTH} 个字符`)
  }
  if (env.IS_PRODUCTION && env.CORS_ORIGINS.length === 0) {
    throw new Error('生产环境必须配置 CORS_ORIGIN')
  }
  if (!BODY_LIMIT_PATTERN.test(env.REQUEST_BODY_LIMIT)) {
    throw new Error('REQUEST_BODY_LIMIT 必须使用 b、kb 或 mb 单位，例如 100kb')
  }
}

validateEnv()

function getLLMProviders() {
  return [
    env.SILICONFLOW_API_KEY && {
      name: 'SiliconFlow',
      baseUrl: env.SILICONFLOW_BASE_URL,
      apiKey: env.SILICONFLOW_API_KEY,
      model: env.SILICONFLOW_MODEL,
    },
    env.DEEPSEEK_API_KEY && {
      name: 'DeepSeek',
      baseUrl: env.DEEPSEEK_BASE_URL,
      apiKey: env.DEEPSEEK_API_KEY,
      model: env.DEEPSEEK_MODEL,
    },
  ].filter(Boolean)
}

export { env, getLLMProviders }
