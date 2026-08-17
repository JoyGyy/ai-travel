import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

/**
 * 行程状态管理 Store
 *
 * 管理旅行行程规划页面的全部数据，包括行程安排、预算、
 * 天气、住宿、景点参考、Agent 执行步骤等。
 *
 * 功能：
 * - 存储和更新行程数据（SSE 流式接收）
 * - 管理预算、住宿、夜生活、天气等辅助信息
 * - 追踪 Agent 执行步骤和加载状态
 * - 支持分享 ID 和重置操作
 * - 支持行程编辑和 Undo/Redo
 */
import type { SSEEvent, WeatherResponse } from '@/types/api'

import { type TemporalState, withHistory } from './withHistory'

// --- 类型定义 ---

/** 住宿推荐 */
export interface Accommodation {
  description?: string
  name: string
  price: number
  priceRange?: string
  rating: number
  type: string
}

/** 景点参考信息 */
export interface AttractionRef {
  city: string
  id: string
  name: string
  priceText: string
  ticketType: 'free' | 'paid'
}

/** 预算明细 */
export interface BudgetBreakdown {
  accommodation: number
  attractions: number
  food: number
  total: number
  transport: number
}

/** 单日行程安排 */
export interface ItineraryDay {
  afternoon?: {
    description: string
    duration: string
    spot: string
    ticket?: string
    transportation?: string
  }
  date?: string
  day: number
  evening?: {
    description: string
    duration: string
    spot: string
    ticket?: string
    transportation?: string
  }
  morning?: {
    description: string
    duration: string
    spot: string
    ticket?: string
    transportation?: string
  }
  spots: Array<{ description: string; duration: string; name: string }>
  title: string
}

/** Store 状态和操作类型 */
interface ItineraryState {
  accommodation: Accommodation[]
  addAgentStep: (step: Extract<SSEEvent, { type: 'step' }>) => void
  // --- 行程编辑相关 ---
  /** 添加景点到指定天 */
  addSpotToDay: (dayIndex: number, spot: ItineraryDay['spots'][0]) => void
  agentSteps: Extract<SSEEvent, { type: 'step' }>[]
  attractionRefs: AttractionRef[]
  budgetBreakdown: BudgetBreakdown | null

  currentAgentStep: number
  /** 编辑模式 */
  isEditing: boolean
  itinerary: ItineraryDay[]
  /** 移动景点位置 */
  moveSpot: (fromDay: number, fromSpot: number, toDay: number, toSpot: number) => void
  nightlife: string[]
  /** 删除指定天的景点 */
  removeSpotFromDay: (dayIndex: number, spotIndex: number) => void

  reset: () => void
  setAccommodation: (data: Accommodation[]) => void
  setAttractionRefs: (data: AttractionRef[]) => void
  setBudgetBreakdown: (data: BudgetBreakdown | null) => void
  setCurrentAgentStep: (step: number) => void
  setEditing: (editing: boolean) => void
  setItinerary: (data: ItineraryDay[]) => void
  setNightlife: (data: string[]) => void
  setTips: (tips: string[]) => void
  setWeather: (weather: null | WeatherResponse) => void
  tips: string[]
  /** 更新景点信息 */
  updateSpot: (dayIndex: number, spotIndex: number, spot: Partial<ItineraryDay['spots'][0]>) => void
  weather: null | WeatherResponse
}

// --- 初始状态 ---

const initialState = {
  accommodation: [],
  agentSteps: [],
  attractionRefs: [],
  budgetBreakdown: null,
  currentAgentStep: 0,
  isEditing: false,
  itinerary: [],
  nightlife: [],
  tips: [],
  weather: null,
}

// --- 创建 Store ---

export const useItineraryStore = create<ItineraryState>()(
  devtools(
    withHistory(
      immer((set) => ({
        ...initialState,

        // --- 简单 Setter 操作 ---

        addAgentStep: (step) =>
          set((state) => {
            const idx = state.agentSteps.findIndex((s) => s.step === step.step)
            if (idx >= 0) {
              state.agentSteps[idx] = step
            } else {
              state.agentSteps.push(step)
            }
          }),
        addSpotToDay: (dayIndex, spot) =>
          set((state) => {
            if (state.itinerary[dayIndex]) {
              state.itinerary[dayIndex].spots.push(spot)
            }
          }),
        moveSpot: (fromDay, fromSpot, toDay, toSpot) =>
          set((state) => {
            const fromDayData = state.itinerary[fromDay]
            const toDayData = state.itinerary[toDay]
            if (!fromDayData || !toDayData) return
            if (fromDayData.spots[fromSpot] === undefined) return

            // 取出源景点
            const [movedSpot] = fromDayData.spots.splice(fromSpot, 1)

            // 插入到目标位置
            const insertIndex = Math.min(toSpot, toDayData.spots.length)
            toDayData.spots.splice(insertIndex, 0, movedSpot)
          }),
        removeSpotFromDay: (dayIndex, spotIndex) =>
          set((state) => {
            if (state.itinerary[dayIndex]?.spots[spotIndex] !== undefined) {
              state.itinerary[dayIndex].spots.splice(spotIndex, 1)
            }
          }),
        reset: () => set(() => initialState),
        setAccommodation: (data) =>
          set((state) => {
            state.accommodation = data
          }),
        setAttractionRefs: (data) =>
          set((state) => {
            state.attractionRefs = data
          }),

        // --- Agent 步骤操作（支持去重更新） ---

        setBudgetBreakdown: (data) =>
          set((state) => {
            state.budgetBreakdown = data
          }),

        // --- 状态控制和重置 ---

        setCurrentAgentStep: (step) =>
          set((state) => {
            state.currentAgentStep = step
          }),
        setEditing: (editing) =>
          set((state) => {
            state.isEditing = editing
          }),

        // --- 行程编辑操作 ---

        setItinerary: (data) =>
          set((state) => {
            state.itinerary = data
          }),

        setNightlife: (data) =>
          set((state) => {
            state.nightlife = data
          }),

        setTips: (tips) =>
          set((state) => {
            state.tips = tips
          }),

        setWeather: (weather) =>
          set((state) => {
            state.weather = weather
          }),

        updateSpot: (dayIndex, spotIndex, spot) =>
          set((state) => {
            if (state.itinerary[dayIndex]?.spots[spotIndex]) {
              Object.assign(state.itinerary[dayIndex].spots[spotIndex], spot)
            }
          }),
      })),
      { limit: 50 },
    ),
    { name: 'ItineraryStore' },
  ),
)

/** 获取 temporal 操作 */
export function getItineraryTemporal(): TemporalState {
  return (useItineraryStore as unknown as { temporal: TemporalState }).temporal
}
