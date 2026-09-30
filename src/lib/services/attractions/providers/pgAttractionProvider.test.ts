import { describe, expect, it } from 'vitest'

import { normalizeStringArray } from './pgAttractionProvider'

describe('normalizeStringArray', () => {
  it('原生字符串数组直接返回清洗后的字符串列表', () => {
    expect(normalizeStringArray([' 提示1 ', '提示2'])).toEqual(['提示1', '提示2'])
    expect(normalizeStringArray([])).toEqual([])
  })

  it('单条普通字符串转换为单元素数组', () => {
    expect(normalizeStringArray('建议提前预约')).toEqual(['建议提前预约'])
    expect(normalizeStringArray('  ')).toEqual([])
  })

  it('PostgreSQL array 字面量字符串解析为数组', () => {
    expect(normalizeStringArray('{提前预约,周一闭馆}')).toEqual(['提前预约', '周一闭馆'])
    expect(normalizeStringArray('{"带好身份证","防晒"}')).toEqual(['带好身份证', '防晒'])
    expect(normalizeStringArray('{}')).toEqual([])
  })

  it('JSON 数组字符串解析为数组', () => {
    expect(normalizeStringArray('["预约", "带雨伞"]')).toEqual(['预约', '带雨伞'])
    expect(normalizeStringArray('[]')).toEqual([])
  })

  it('null、undefined 或非法类型安全回退为空数组', () => {
    expect(normalizeStringArray(null)).toEqual([])
    expect(normalizeStringArray(undefined)).toEqual([])
    expect(normalizeStringArray(123)).toEqual([])
    expect(normalizeStringArray({})).toEqual([])
  })
})
