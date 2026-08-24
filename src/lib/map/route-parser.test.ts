import { describe, expect, it } from 'vitest'
import { parseItineraryFromMarkdown } from './route-parser'

describe('route-parser', () => {
  it('应该能正确从包含箭头链的文本提取景点和路线', () => {
    const text = `
# 大理洱海环湖攻略
🌟 【行程亮点与核心建议】：建议逆时针自驾环湖。
🗺️ 【详细游览路线】：大理古城 → 喜洲古镇 → 双廊古镇 → 挖色镇 → 海东镇。
🍜 【地道美食打卡】：
- 喜洲粑粑
- 白族酸辣鱼
💡 【交通与避坑指南】：
> 💡 上午海西顺光拍照，下午海东临水观日落。
`
    const parsed = parseItineraryFromMarkdown(text)
    expect(parsed.city).toBe('大理')
    expect(parsed.transportMode).toBe('driving')
    expect(parsed.spots.map(s => s.name)).toEqual(['大理古城', '喜洲古镇', '双廊古镇', '挖色镇', '海东镇'])
    expect(parsed.food).toContain('喜洲粑粑')
    expect(parsed.tips.length).toBeGreaterThan(0)
  })

  it('应该能正确处理列表项格式并识别成都', () => {
    const text = `
成都大熊猫与美食漫游：
- 大熊猫繁育研究基地
- 杜甫草堂
- 宽窄巷子
- 奎星楼街
推荐乘坐地铁或公交前往。
`
    const parsed = parseItineraryFromMarkdown(text)
    expect(parsed.city).toBe('成都')
    expect(parsed.transportMode).toBe('transit')
    expect(parsed.spots.length).toBeGreaterThanOrEqual(3)
  })
})
