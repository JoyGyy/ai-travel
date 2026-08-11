/**
 * 参数校验工具函数
 * 统一提供给各 API route handler 使用，避免重复定义
 */
import { httpError } from './http'

/** 校验必填字符串字段 */
export function readRequiredString(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number } = {},
): string {
  const { min = 1, max = 2000 } = options
  if (typeof value !== 'string') throw httpError(400, `${fieldName}必须是文本`)
  const trimmed = value.trim()
  if (trimmed.length < min) throw httpError(400, `请输入${fieldName}`)
  if (trimmed.length > max) throw httpError(400, `${fieldName}不能超过 ${max} 个字符`)
  return trimmed
}

/** 校验可选字符串字段 */
export function readOptionalString(value: unknown, fieldName: string, max: number): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw httpError(400, `${fieldName}必须是文本`)
  const trimmed = value.trim()
  if (trimmed.length > max) throw httpError(400, `${fieldName}不能超过 ${max} 个字符`)
  return trimmed
}

/** 校验正整数字段 */
export function readPositiveInteger(
  value: unknown,
  fieldName: string,
  options: { min?: number; max?: number } = {},
): number {
  const { min = 1, max = 30 } = options
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的整数`)
  return number
}

/** 校验数组参数 */
export function ensureArray(
  value: unknown,
  fieldName: string,
  options: { max?: number } = {},
): unknown[] {
  const { max = 20 } = options
  if (value === undefined) return []
  if (!Array.isArray(value)) throw httpError(400, `${fieldName}必须是数组`)
  if (value.length > max) throw httpError(400, `${fieldName}最多支持 ${max} 条`)
  return value
}

/** 读取布尔值（支持字符串 'true'/'1'） */
export function readBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1'
}
