import { evaluateRetrieval } from './rag-eval'

describe('evaluateRetrieval', () => {
  it('计算 Hit@1、Hit@3 和 MRR', () => {
    const result = evaluateRetrieval(
      [
        { city: '北京', expected: ['故宫博物院'], query: '北京皇家宫殿' },
        { city: '杭州', expected: ['西湖'], query: '杭州自然风景' },
        { city: '成都', expected: ['宽窄巷子'], query: '成都历史街区' },
      ],
      [['故宫博物院'], ['灵隐寺', '西湖'], ['武侯祠', '锦里', '宽窄巷子']],
    )

    expect(result).toEqual({
      hitAt1: 1 / 3,
      hitAt3: 1,
      meanReciprocalRank: (1 + 1 / 2 + 1 / 3) / 3,
      total: 3,
    })
  })
})
