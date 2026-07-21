/**
 * 参数校验工具
 * 提供常用的数据类型和范围校验函数，校验失败抛出 HttpError(400)
 */
import { httpError } from './http.js'

/** 数值范围选项 */
interface RangeOptions {
  min?: number
  max?: number
}

/** 校验必填字符串参数，去除首尾空格后检查长度范围 */
export function readRequiredString(value: unknown, fieldName: string, options: RangeOptions & { min?: number, max?: number } = {}): string {
  const { min = 1, max = 2000 } = options
  if (typeof value !== 'string')
    throw httpError(400, `${fieldName}必须是文本`)

  const trimmed = value.trim()
  if (trimmed.length < min)
    throw httpError(400, `请输入${fieldName}`)
  if (trimmed.length > max)
    throw httpError(400, `${fieldName}不能超过 ${max} 个字符`)

  return trimmed
}

/** 校验正整数参数，检查范围是否在 [min, max] 内 */
export function readPositiveInteger(value: unknown, fieldName: string, options: RangeOptions & { min?: number, max?: number } = {}): number {
  const { min = 1, max = 30 } = options
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的整数`)
  return number
}

/** 校验正数参数（支持小数），检查范围是否在 [min, max] 内 */
export function readPositiveNumber(value: unknown, fieldName: string, options: RangeOptions & { min?: number, max?: number } = {}): number {
  const { min = 1, max = 1_000_000 } = options
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的数字`)
  return number
}

/** 校验数组参数，undefined 时返回空数组，超过最大长度时抛错 */
export function ensureArray(value: unknown, fieldName: string, options: { max?: number } = {}): unknown[] {
  const { max = 20 } = options
  if (value === undefined)
    return []
  if (!Array.isArray(value))
    throw httpError(400, `${fieldName}必须是数组`)
  if (value.length > max)
    throw httpError(400, `${fieldName}最多支持 ${max} 条`)
  return value
}
