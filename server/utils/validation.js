import { httpError } from './http.js'

export function readRequiredString(value, fieldName, options = {}) {
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

export function readPositiveInteger(value, fieldName, options = {}) {
  const { min = 1, max = 30 } = options
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的整数`)
  return number
}

export function readPositiveNumber(value, fieldName, options = {}) {
  const { min = 1, max = 1_000_000 } = options
  const number = Number(value)
  if (!Number.isFinite(number) || number < min || number > max)
    throw httpError(400, `${fieldName}必须是 ${min}-${max} 之间的数字`)
  return number
}

export function ensureArray(value, fieldName, options = {}) {
  const { max = 20 } = options
  if (value === undefined)
    return []
  if (!Array.isArray(value))
    throw httpError(400, `${fieldName}必须是数组`)
  if (value.length > max)
    throw httpError(400, `${fieldName}最多支持 ${max} 条`)
  return value
}
