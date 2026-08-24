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

  it('应该能准确过滤「预算分配、核心体验、最佳季节」等非景点元数据，仅提取真实武汉景点', () => {
    const text = `
【武汉】打卡路线规划
1. 预算分配：人均约 500-800 元
2. 核心体验：登黄鹤楼远眺长江大桥，漫步昙华林文艺街区
3. 最佳季节：3-5月赏樱或9-11月秋高气爽
4. 户部巷：清晨过早热干面与三鲜豆皮
5. 黄鹤楼：上午登楼俯瞰江城胜景
6. 辛亥革命博物馆：午后瞻仰红楼历史
7. 粮道街：傍晚寻味赵师傅油饼包烧麦
8. 昙华林：夜间漫步文艺咖啡小店
`
    const parsed = parseItineraryFromMarkdown(text)
    expect(parsed.city).toBe('武汉')
    expect(parsed.spots.map(s => s.name)).toEqual([
      '户部巷',
      '黄鹤楼',
      '辛亥革命博物馆',
      '粮道街',
      '昙华林',
    ])
    expect(parsed.spots.map(s => s.name)).not.toContain('预算分配')
    expect(parsed.spots.map(s => s.name)).not.toContain('核心体验')
    expect(parsed.spots.map(s => s.name)).not.toContain('最佳季节')
  })

  it('应该能从时间段前缀（如 早晨：户部巷）中正确提取冒号后的真实景点名称', () => {
    const text = `
武汉经典一日慢游：
* **早晨**：户部巷（汉味早点）
* **上午**：黄鹤楼（登楼望江）
* **下午**：辛亥革命博物馆（首义红楼）
* **傍晚**：粮道街（特色小吃）
* **夜间**：昙华林（老建筑漫步）
`
    const parsed = parseItineraryFromMarkdown(text, '武汉')
    expect(parsed.spots.map(s => s.name)).toEqual([
      '户部巷',
      '黄鹤楼',
      '辛亥革命博物馆',
      '粮道街',
      '昙华林',
    ])
  })
})
