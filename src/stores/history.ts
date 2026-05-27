/**
 * 历史记录状态管理
 * 使用 Zustand + persist 中间件自动同步 localStorage
 */
import type { HistoryRecord } from '@/types'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HistoryState {
  records: HistoryRecord[]
  addRecord: (record: HistoryRecord) => void
  deleteRecord: (index: number) => void
  clearRecords: () => void
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    set => ({
      records: [],

      addRecord: record =>
        set(state => ({
          records: [record, ...state.records].slice(0, 20),
        })),

      deleteRecord: index =>
        set(state => ({
          records: state.records.filter((_, i) => i !== index),
        })),

      clearRecords: () => set({ records: [] }),
    }),
    { name: 'travel_history' },
  ),
)
