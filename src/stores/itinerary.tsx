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
 */
import type { SSEEvent, WeatherResponse } from '@/types/api'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// --- 类型定义 ---

/** 单日行程安排 */
export interface ItineraryDay {
  day: number
  title: string
  spots: Array<{ name: string; description: string; duration: string }>
  date?: string
  morning?: {
    spot: string
    description: string
    duration: string
    ticket?: string
    transportation?: string
  }
  afternoon?: {
    spot: string
    description: string
    duration: string
    ticket?: string
    transportation?: string
  }
  evening?: {
    spot: string
    description: string
    duration: string
    ticket?: string
    transportation?: string
  }
}

/** 景点参考信息 */
export interface AttractionRef {
  id: string
  name: string
  city: string
  ticketType: 'free' | 'paid'
  priceText: string
}

/** 预算明细 */
export interface BudgetBreakdown {
  accommodation: number
  transport: number
  food: number
  attractions: number
  total: number
}

/** 住宿推荐 */
export interface Accommodation {
  name: string
  type: string
  price: number
  rating: number
  description?: string
  priceRange?: string
}

/** Store 状态和操作类型 */
interface ItineraryState {
  itinerary: ItineraryDay[]
  budgetBreakdown: BudgetBreakdown | null
  tips: string[]
  weather: WeatherResponse | null
  accommodation: Accommodation[]
  nightlife: string[]
  attractionRefs: AttractionRef[]
  agentSteps: Extract<SSEEvent, { type: 'step' }>[]
  currentAgentStep: number
  setItinerary: (data: ItineraryDay[]) => void
  setBudgetBreakdown: (data: BudgetBreakdown | null) => void
  setTips: (tips: string[]) => void
  setWeather: (weather: WeatherResponse | null) => void
  setAccommodation: (data: Accommodation[]) => void
  setNightlife: (data: string[]) => void
  setAttractionRefs: (data: AttractionRef[]) => void
  addAgentStep: (step: Extract<SSEEvent, { type: 'step' }>) => void
  setCurrentAgentStep: (step: number) => void
  reset: () => void
}

// --- 初始状态 ---

const initialState = {
  itinerary: [],
  budgetBreakdown: null,
  tips: [],
  weather: null,
  accommodation: [],
  nightlife: [],
  attractionRefs: [],
  agentSteps: [],
  currentAgentStep: 0,
}

// --- 创建 Store ---

export const useItineraryStore = create<ItineraryState>()(
  devtools(
    immer((set) => ({
      ...initialState,

      // --- 简单 Setter 操作 ---

      setItinerary: (data) =>
        set((state) => {
          state.itinerary = data
        }),
      setBudgetBreakdown: (data) =>
        set((state) => {
          state.budgetBreakdown = data
        }),
      setTips: (tips) =>
        set((state) => {
          state.tips = tips
        }),
      setWeather: (weather) =>
        set((state) => {
          state.weather = weather
        }),
      setAccommodation: (data) =>
        set((state) => {
          state.accommodation = data
        }),
      setNightlife: (data) =>
        set((state) => {
          state.nightlife = data
        }),
      setAttractionRefs: (data) =>
        set((state) => {
          state.attractionRefs = data
        }),

      // --- Agent 步骤操作（支持去重更新） ---

      addAgentStep: (step) =>
        set((state) => {
          const idx = state.agentSteps.findIndex((s) => s.step === step.step)
          if (idx >= 0) {
            state.agentSteps[idx] = step
          } else {
            state.agentSteps.push(step)
          }
        }),

      // --- 状态控制和重置 ---

      setCurrentAgentStep: (step) =>
        set((state) => {
          state.currentAgentStep = step
        }),
      reset: () => set(() => initialState),
    })),
    { name: 'ItineraryStore' },
  ),
)
