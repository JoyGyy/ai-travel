/**
 * 行程状态管理
 * 管理行程规划页面的数据和加载状态
 */
import type { AccommodationInfo, AgentStep, BudgetBreakdown, DayItinerary, NightlifeInfo, WeatherInfo } from '@/types'
import { create } from 'zustand'

interface ItineraryState {
  itinerary: DayItinerary[]
  budgetBreakdown: BudgetBreakdown | null
  tips: string[]
  weather: WeatherInfo | null
  accommodation: AccommodationInfo[]
  nightlife: NightlifeInfo[]
  agentSteps: AgentStep[]
  currentAgentStep: number
  isLoading: boolean

  setItinerary: (data: DayItinerary[]) => void
  setBudgetBreakdown: (data: BudgetBreakdown | null) => void
  setTips: (tips: string[]) => void
  setWeather: (weather: WeatherInfo | null) => void
  setAccommodation: (data: AccommodationInfo[]) => void
  setNightlife: (data: NightlifeInfo[]) => void
  addAgentStep: (step: AgentStep) => void
  setCurrentAgentStep: (step: number) => void
  setLoading: (loading: boolean) => void
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
}

export const useItineraryStore = create<ItineraryState>(set => ({
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
  reset: () => set(initialState),
}))
