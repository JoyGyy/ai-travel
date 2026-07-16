/**
 * 行程状态管理
 * 管理行程规划页面的数据和加载状态
 */
import type { SSEEvent, WeatherResponse } from '@/types/api'
import { create } from 'zustand'

export interface ItineraryDay {
  day: number
  title: string
  spots: Array<{ name: string; description: string; duration: string }>
  date?: string
  morning?: { spot: string; description: string; duration: string; ticket?: string; transportation?: string }
  afternoon?: { spot: string; description: string; duration: string; ticket?: string; transportation?: string }
  evening?: { spot: string; description: string; duration: string; ticket?: string; transportation?: string }
}

export interface BudgetBreakdown {
  accommodation: number
  transport: number
  food: number
  attractions: number
  total: number
}

export interface Accommodation {
  name: string
  type: string
  price: number
  rating: number
  description?: string
  priceRange?: string
}

interface ItineraryState {
  itinerary: ItineraryDay[]
  budgetBreakdown: BudgetBreakdown | null
  tips: string[]
  weather: WeatherResponse | null
  accommodation: Accommodation[]
  nightlife: string[]
  agentSteps: Extract<SSEEvent, { type: 'step' }>[]
  currentAgentStep: number
  isLoading: boolean
  shareId: string | null
  setItinerary: (data: ItineraryDay[]) => void
  setBudgetBreakdown: (data: BudgetBreakdown | null) => void
  setTips: (tips: string[]) => void
  setWeather: (weather: WeatherResponse | null) => void
  setAccommodation: (data: Accommodation[]) => void
  setNightlife: (data: string[]) => void
  addAgentStep: (step: Extract<SSEEvent, { type: 'step' }>) => void
  setCurrentAgentStep: (step: number) => void
  setLoading: (loading: boolean) => void
  setShareId: (id: string | null) => void
  reset: () => void
}

const initialState = {
  itinerary: [],
  budgetBreakdown: null,
  tips: [],
  weather: null,
  accommodation: [],
  nightlife: [],
  agentSteps: [],
  currentAgentStep: 0,
  isLoading: false,
  shareId: null,
}

export const useItineraryStore = create<ItineraryState>()(set => ({
  ...initialState,

  setItinerary: data => set({ itinerary: data }),
  setBudgetBreakdown: data => set({ budgetBreakdown: data }),
  setTips: tips => set({ tips }),
  setWeather: weather => set({ weather }),
  setAccommodation: data => set({ accommodation: data }),
  setNightlife: data => set({ nightlife: data }),

  addAgentStep: step =>
    set((state) => {
      const exists = state.agentSteps.find(s => s.step === step.step)
      if (exists) {
        return { agentSteps: state.agentSteps.map(s => s.step === step.step ? step : s) }
      }
      return { agentSteps: [...state.agentSteps, step] }
    }),

  setCurrentAgentStep: step => set({ currentAgentStep: step }),
  setLoading: loading => set({ isLoading: loading }),
  setShareId: id => set({ shareId: id }),
  reset: () => set(initialState),
}))
