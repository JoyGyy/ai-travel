import { extractRagSources } from './sources'

describe('extractRagSources', () => {
  it('从 RAG 和产品景点工具输出中提取去重后的来源', () => {
    expect(extractRagSources([
      { attractions: [{ name: '故宫博物院' }, { name: '八达岭长城' }], city: '北京' },
      { items: [{ city: '北京', name: '故宫博物院' }] },
    ])).toEqual(['北京 · 故宫博物院', '北京 · 八达岭长城'])
  })

  it('忽略非结构化工具输出', () => {
    expect(extractRagSources(null)).toEqual([])
  })
})
