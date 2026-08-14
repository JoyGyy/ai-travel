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
 */
import type { SSEEvent, WeatherResponse } from '@/types/api'

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
  spots: Array<{ description: string; duration: string; name: string; }>
  title: string
}

/** Store 状态和操作类型 */
interface ItineraryState {
  accommodation: Accommodation[]
  addAgentStep: (step: Extract<SSEEvent, { type: 'step' }>) => void
  agentSteps: Extract<SSEEvent, { type: 'step' }>[]
  attractionRefs: AttractionRef[]
  budgetBreakdown: BudgetBreakdown | null
  currentAgentStep: number
  itinerary: ItineraryDay[]
  nightlife: string[]
  reset: () => void
  setAccommodation: (data: Accommodation[]) => void
  setAttractionRefs: (data: AttractionRef[]) => void
  setBudgetBreakdown: (data: BudgetBreakdown | null) => void
  setCurrentAgentStep: (step: number) => void
  setItinerary: (data: ItineraryDay[]) => void
  setNightlife: (data: string[]) => void
  setTips: (tips: string[]) => void
  setWeather: (weather: null | WeatherResponse) => void
  tips: string[]
  weather: null | WeatherResponse
}

// --- 初始状态 ---

const initialState = {
  accommodation: [],
  agentSteps: [],
  attractionRefs: [],
  budgetBreakdown: null,
  currentAgentStep: 0,
  itinerary: [],
  nightlife: [],
  tips: [],
  weather: null,
}

// --- 创建 Store ---

export const useItineraryStore = create<ItineraryState>()(
  devtools(
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
      reset: () => set(() => initialState),
      setAccommodation: (data) =>
        set((state) => {
          state.accommodation = data
        }),
      setAttractionRefs: (data) =>
        set((state) => {
          state.attractionRefs = data
        }),
      setBudgetBreakdown: (data) =>
        set((state) => {
          state.budgetBreakdown = data
        }),
      setCurrentAgentStep: (step) =>
        set((state) => {
          state.currentAgentStep = step
        }),
      setItinerary: (data) =>
        set((state) => {
          state.itinerary = data
        }),

      // --- Agent 步骤操作（支持去重更新） ---

      setNightlife: (data) =>
        set((state) => {
          state.nightlife = data
        }),

      // --- 状态控制和重置 ---

      setTips: (tips) =>
        set((state) => {
          state.tips = tips
        }),
      setWeather: (weather) =>
        set((state) => {
          state.weather = weather
        }),
    })),
    { name: 'ItineraryStore' },
  ),
)
