/**
 * 历史记录状态管理
 * 每个用户的历史记录独立存储到 localStorage
 */
import type { HistoryRecord } from '@/types'
import { create } from 'zustand'

interface HistoryState {
  records: HistoryRecord[]
  /** 当前用户的存储 key */
  _key: string
  addRecord: (record: HistoryRecord) => void
  deleteRecord: (index: number) => void
  /** 登录时加载用户历史记录 */
  loadUserHistory: (userId: string) => void
  /** 退出时保存并清空 */
  saveAndClear: () => void
}

/** 保存到 localStorage */
function saveToStorage(key: string, records: HistoryRecord[]) {
  localStorage.setItem(key, JSON.stringify(records))
}

/** 从 localStorage 读取 */
function loadFromStorage(key: string): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  }
  catch {
    return []
  }
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  records: [],
  _key: 'travel_history_guest',

  addRecord: (record) => {
    const { _key } = get()
    const updated = [record, ...get().records].slice(0, 20)
    saveToStorage(_key, updated)
    set({ records: updated })
  },

  deleteRecord: (index) => {
    const { _key } = get()
    const updated = get().records.filter((_, i) => i !== index)
    saveToStorage(_key, updated)
    set({ records: updated })
  },

  loadUserHistory: (userId: string) => {
    const key = `travel_history_${userId}`
    const records = loadFromStorage(key)
    set({ records, _key: key })
  },

  saveAndClear: () => {
    const { _key, records } = get()
    saveToStorage(_key, records)
    set({ records: [], _key: 'travel_history_guest' })
  },
}))
