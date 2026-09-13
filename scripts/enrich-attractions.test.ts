import { describe, expect, it } from 'vitest'

import {
  buildCtripBookingLink,
  generateAttractionId,
  generateMockEnrichedEntry,
  main,
  validateEnrichedAttraction,
} from './enrich-attractions'

describe('enrich-attractions 自动化数据工具', () => {
  it('正确生成标准化的拼音/英文 slug id', () => {
    expect(generateAttractionId('成都', '锦里')).toBe('chengdu-jinli')
    expect(generateAttractionId('北京', '故宫博物院')).toBe('beijing-palace-museum')
    expect(generateAttractionId('苏州', '拙政园')).toBe('苏州-拙政园')
  })

  it('正确生成携程分销与搜索推广链接', () => {
    const link = buildCtripBookingLink('成都', '大熊猫繁育研究基地')
    expect(link).toContain('https://m.ctrip.com/webapp/ticket/dest/t0.html')
    expect(link).toContain(encodeURIComponent('成都 大熊猫繁育研究基地'))
    expect(link).toContain('allianceid=ai_travel')
  })

  it('生成完整且符合规范的景点手账数据', () => {
    const entry = generateMockEnrichedEntry('成都', '宽窄巷子')
    expect(entry.id).toBe('chengdu-kuanzhaixiangzi')
    expect(entry.city).toBe('成都')
    expect(entry.name).toBe('宽窄巷子')
    expect(entry.ticketType).toBe('free')
    expect(entry.highlights.length).toBeGreaterThan(0)
    expect(entry.tips.length).toBeGreaterThan(0)
    expect(entry.suitableFor.length).toBeGreaterThan(0)
    expect(entry.bookingLinks.ctrip).toBeDefined()

    const validation = validateEnrichedAttraction(entry)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('捕获不合规的残缺数据', () => {
    const invalidEntry = generateMockEnrichedEntry('成都', '测试点', { highlights: [], tips: [] })
    const validation = validateEnrichedAttraction(invalidEntry)
    expect(validation.valid).toBe(false)
    expect(validation.errors).toContain('highlights 至少提供 1 条')
    expect(validation.errors).toContain('tips 至少提供 1 条')
  })

  it('main 函数支持在 dry-run 模式下顺利跑通', async () => {
    await expect(main(['--dry-run'])).resolves.not.toThrow()
  })
})
