import { beforeEach, describe, expect, it } from 'vitest'
import {
  loadCollections,
  loadHistory,
  saveToCollections,
  saveToHistory,
  deleteHistoryRecord,
  loadItineraryCache,
  saveItineraryCache,
} from '../storage'

const mockResult = {
  city: '杭州',
  days: 3,
  totalBudget: 5000,
  dailyItinerary: [],
  budgetBreakdown: { accommodation: 1750, food: 1250, transportation: 750, tickets: 250, other: 1050 },
  tips: ['提示1'],
}

describe('Storage 工具函数', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('历史记录', () => {
    it('空存储应返回空数组', () => {
      expect(loadHistory()).toEqual([])
    })

    it('保存后应能读取', () => {
      saveToHistory(mockResult)
      const history = loadHistory()
      expect(history.length).toBe(1)
      expect(history[0].city).toBe('杭州')
      expect(history[0].budget).toBe(5000)
    })

    it('应限制最多 20 条记录', () => {
      for (let i = 0; i < 25; i++) {
        saveToHistory({ ...mockResult, city: `城市${i}` })
      }
      expect(loadHistory().length).toBe(20)
    })

    it('deleteRecord 应删除指定索引', () => {
      saveToHistory({ ...mockResult, city: 'A' })
      saveToHistory({ ...mockResult, city: 'B' })
      // B 在索引 0（最新的在前），A 在索引 1
      deleteHistoryRecord(1)
      const history = loadHistory()
      expect(history.length).toBe(1)
      expect(history[0].city).toBe('B')
    })
  })

  describe('收藏', () => {
    it('空存储应返回空数组', () => {
      expect(loadCollections()).toEqual([])
    })

    it('保存后应能读取', () => {
      const item = {
        city: '北京',
        days: 2,
        budget: 3000,
        date: '2026-05-27',
        itinerary: [],
        budgetBreakdown: null as any,
        tips: [],
      }
      saveToCollections(item)
      expect(loadCollections().length).toBe(1)
    })
  })

  describe('行程缓存', () => {
    it('未缓存应返回 null', () => {
      expect(loadItineraryCache('杭州', 5000, 3)).toBeNull()
    })

    it('保存后应能按 key 读取', () => {
      const data = { itinerary: [], budgetBreakdown: null, tips: [] }
      saveItineraryCache('杭州', 5000, 3, data as any)
      expect(loadItineraryCache('杭州', 5000, 3)).toEqual(data)
      expect(loadItineraryCache('北京', 5000, 3)).toBeNull()
    })
  })

  describe('损坏数据处理', () => {
    it('localStorage 中有非法 JSON 不应崩溃', () => {
      localStorage.setItem('travel_history', 'not-json!!!')
      expect(loadHistory()).toEqual([])
    })
  })
})
