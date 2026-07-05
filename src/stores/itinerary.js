/**
 * 行程状态管理
 * 管理行程规划页面的数据和加载状态
 */
import { create } from 'zustand'

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

export const useItineraryStore = create(set => ({
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
