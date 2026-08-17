/**
 * Zustand 中间件：实现 Undo/Redo 历史记录功能
 *
 * 原理：维护一个快照栈，每次状态变更时保存快照，
 * 支持撤销（undo）和重做（redo）操作。
 *
 * @example
 * const useStore = create(
 *   withHistory((set, get) => ({
 *     items: [],
 *     setItems: (items) => set({ items }),
 *   }))
 * )
 *
 * // 使用
 * const { undo, redo, canUndo, canRedo } = useStore.temporal.getState()
 */
import type { StateCreator, StoreMutatorIdentifier } from 'zustand'

/** temporal 返回的操作接口 */
export interface TemporalState<_T = unknown> {
  /** 是否可以重做 */
  canRedo: () => boolean
  /** 是否可以撤销 */
  canUndo: () => boolean
  /** 清空历史记录 */
  clear: () => void
  /** 获取历史记录大小 */
  getHistorySize: () => { future: number; past: number }
  /** 重做 */
  redo: () => void
  /** 保存当前状态快照 */
  snapshot: () => void
  /** 撤销 */
  undo: () => void
}

/** 历史记录状态 */
interface HistoryState<T> {
  future: T[]
  past: T[]
}

type WithHistory = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  options?: WithHistoryOptions,
) => StateCreator<T, Mps, Mcs>

/** 中间件配置选项 */
interface WithHistoryOptions {
  /** 状态相等性比较函数 */
  equality?: (a: unknown, b: unknown) => boolean
  /** 最大历史记录数 */
  limit?: number
}

/** 深拷贝：使用 JSON 序列化（兼容 immer proxy 状态） */
function deepClone<T>(value: T): T {
  try {
    return JSON.parse(JSON.stringify(value)) as T
  } catch {
    return value
  }
}

/** 默认相等性比较：使用 JSON.stringify */
function defaultEquality(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * withHistory 中间件
 * 为 Zustand store 添加 undo/redo 能力
 */
export const withHistory: WithHistory = (f, options = {}) => {
  const { equality = defaultEquality, limit = 50 } = options

  return (set, get, store) => {
    // 历史记录状态
    const history: HistoryState<unknown> = {
      future: [],
      past: [],
    }

    // 保存快照
    const snapshot = () => {
      const currentState = get()
      const lastPast = history.past[history.past.length - 1]

      // 如果状态没有变化，不保存
      if (lastPast && equality(lastPast, currentState)) {
        return
      }

      history.past.push(deepClone(currentState))

      // 限制历史记录大小
      if (history.past.length > limit) {
        history.past.shift()
      }

      // 新操作清空重做栈
      history.future = []
    }

    // 撤销
    const undo = () => {
      if (history.past.length === 0) return

      const currentState = get()
      const previousState = history.past.pop()!

      history.future.push(deepClone(currentState))
      ;(set as unknown as (partial: unknown) => void)(deepClone(previousState))
    }

    // 重做
    const redo = () => {
      if (history.future.length === 0) return

      const currentState = get()
      const nextState = history.future.pop()!

      history.past.push(deepClone(currentState))
      ;(set as unknown as (partial: unknown) => void)(deepClone(nextState))
    }

    // 是否可以撤销
    const canUndo = () => history.past.length > 0

    // 是否可以重做
    const canRedo = () => history.future.length > 0

    // 清空历史
    const clear = () => {
      history.past = []
      history.future = []
    }

    // 获取历史大小
    const getHistorySize = () => ({
      future: history.future.length,
      past: history.past.length,
    })

    // 包装 set 函数，自动保存快照
    const wrappedSet = (...args: unknown[]) => {
      snapshot()
      ;(set as unknown as (...a: unknown[]) => void)(...args)
    }

    // 扩展 store，挂载 temporal 操作
    const storeWithTemporal = store as unknown as {
      temporal: TemporalState
    }
    storeWithTemporal.temporal = {
      canRedo,
      canUndo,
      clear,
      getHistorySize,
      redo,
      snapshot,
      undo,
    }

    return f(wrappedSet as never, get, store)
  }
}

/**
 * Hook：获取 temporal 操作
 * @param store Zustand store
 * @returns temporal 操作对象
 */
export function useTemporal(store: { temporal: TemporalState }): TemporalState {
  return store.temporal
}
