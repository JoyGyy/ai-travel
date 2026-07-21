import { httpError } from './http.js'

interface RangeOptions {
  min?: number
  max?: number
}

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

export function readPositiveInteger(value: unknown, fieldName: string, options: RangeOptions & { min?: number, max?: number } = {}): number {
  const { min = 1, max = 30 } = options
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的整数`)
  return number
}

export function readPositiveNumber(value: unknown, fieldName: string, options: RangeOptions & { min?: number, max?: number } = {}): number {
  const { min = 1, max = 1_000_000 } = options
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的数字`)
  return number
}

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
