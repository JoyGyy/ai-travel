import { describe, expect, it } from 'vitest'
import { TFIDFIndex, tokenize, computeTF } from '../tfidf'

describe('TF-IDF 语义检索', () => {
  describe('tokenize 分词器', () => {
    it('应生成 unigram 和 bigram', () => {
      const tokens = tokenize('西湖')
      expect(tokens).toContain('西')
      expect(tokens).toContain('湖')
      expect(tokens).toContain('西湖')
    })

    it('应去除标点符号', () => {
      const tokens = tokenize('你好，世界！')
      expect(tokens).not.toContain('，')
      expect(tokens).not.toContain('！')
    })

    it('空字符串应返回空数组', () => {
      expect(tokenize('')).toEqual([])
    })
  })

  describe('computeTF 词频计算', () => {
    it('应正确计算归一化词频', () => {
      const tf = computeTF(['a', 'b', 'a'])
      expect(tf.get('a')).toBeCloseTo(2 / 3)
      expect(tf.get('b')).toBeCloseTo(1 / 3)
    })

    it('空数组应返回空 Map', () => {
      const tf = computeTF([])
      expect(tf.size).toBe(0)
    })
  })

  describe('TFIDFIndex 索引', () => {
    it('应正确构建索引', () => {
      const index = new TFIDFIndex()
      index.buildIndex([
        { id: 'doc1', text: '西湖 杭州 人间天堂' },
        { id: 'doc2', text: '故宫 北京 皇家宫殿' },
      ])
      expect(index.totalDocs).toBe(2)
      expect(index.docIds).toEqual(['doc1', 'doc2'])
    })

    it('相同文档应有高相似度', () => {
      const index = new TFIDFIndex()
      index.buildIndex([
        { id: 'doc1', text: '西湖 杭州 人间天堂' },
        { id: 'doc2', text: '故宫 北京 皇家宫殿' },
      ])
      const score = index.similarity('西湖 杭州', 'doc1')
      expect(score).toBeGreaterThan(0.5)
    })

    it('不相关文档应有低相似度', () => {
      const index = new TFIDFIndex()
      index.buildIndex([
        { id: 'doc1', text: '西湖 杭州 人间天堂' },
        { id: 'doc2', text: '故宫 北京 皇家宫殿' },
      ])
      const score = index.similarity('西湖 杭州', 'doc2')
      expect(score).toBeLessThan(0.3)
    })

    it('search 应按相似度降序返回', () => {
      const index = new TFIDFIndex()
      index.buildIndex([
        { id: 'doc1', text: '西湖 杭州 人间天堂 景色优美' },
        { id: 'doc2', text: '故宫 北京 皇家宫殿 历史悠久' },
        { id: 'doc3', text: '灵隐寺 杭州 古寺 佛教圣地' },
      ])
      const results = index.search('杭州 西湖')
      expect(results[0].id).toBe('doc1')
      expect(results[0].score).toBeGreaterThan(results[1].score)
    })

    it('空查询不应报错', () => {
      const index = new TFIDFIndex()
      index.buildIndex([{ id: 'doc1', text: '测试' }])
      const results = index.search('')
      expect(results.length).toBe(1)
    })
  })
})
