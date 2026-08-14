import type { SSEEvent, WeatherResponse } from '@/types/api'

import type { Accommodation, AttractionRef, BudgetBreakdown, ItineraryDay } from './itinerary'

import { useItineraryStore } from './itinerary'

// --- 测试数据 ---

const mockItinerary: ItineraryDay[] = [
  {
    day: 1,
    spots: [{ description: '皇家宫殿', duration: '3小时', name: '故宫' }],
    title: '第一天',
  },
]

const mockBudget: BudgetBreakdown = {
  accommodation: 500,
  attractions: 150,
  food: 300,
  total: 1150,
  transport: 200,
}

const mockWeather: WeatherResponse = {
  city: '北京',
  temperature: 25,
  weatherDesc: '晴',
}

const mockAccommodation: Accommodation[] = [
  { name: '酒店A', price: 200, rating: 4.5, type: '经济型' },
]

const mockAttractionRefs: AttractionRef[] = [
  { city: '北京', id: '1', name: '故宫', priceText: '60元', ticketType: 'paid' },
]

const mockStep: Extract<SSEEvent, { type: 'step' }> = {
  name: '查询景点',
  status: 'start',
  step: 1,
  type: 'step',
}

// --- 测试套件 ---

describe('useItineraryStore', () => {
  // 每个测试前重置 store
  beforeEach(() => {
    useItineraryStore.setState({
      accommodation: [],
      agentSteps: [],
      attractionRefs: [],
      budgetBreakdown: null,
      currentAgentStep: 0,
      itinerary: [],
      nightlife: [],
      tips: [],
      weather: null,
    })
  })

  describe('初始状态', () => {
    it('itinerary 应该为空数组', () => {
      expect(useItineraryStore.getState().itinerary).toEqual([])
    })

    it('budgetBreakdown 应该为 null', () => {
      expect(useItineraryStore.getState().budgetBreakdown).toBeNull()
    })

    it('agentSteps 应该为空数组', () => {
      expect(useItineraryStore.getState().agentSteps).toEqual([])
    })

    it('currentAgentStep 应该为 0', () => {
      expect(useItineraryStore.getState().currentAgentStep).toBe(0)
    })
  })

  describe('setItinerary', () => {
    it('应该更新行程数据', () => {
      useItineraryStore.getState().setItinerary(mockItinerary)
      expect(useItineraryStore.getState().itinerary).toEqual(mockItinerary)
    })
  })

  describe('setBudgetBreakdown', () => {
    it('应该更新预算数据', () => {
      useItineraryStore.getState().setBudgetBreakdown(mockBudget)
      expect(useItineraryStore.getState().budgetBreakdown).toEqual(mockBudget)
    })

    it('设置为 null 应该清空预算', () => {
      useItineraryStore.setState({ budgetBreakdown: mockBudget })
      useItineraryStore.getState().setBudgetBreakdown(null)
      expect(useItineraryStore.getState().budgetBreakdown).toBeNull()
    })
  })

  describe('setTips', () => {
    it('应该更新提示数据', () => {
      const tips = ['带好防晒', '穿舒适的鞋']
      useItineraryStore.getState().setTips(tips)
      expect(useItineraryStore.getState().tips).toEqual(tips)
    })
  })

  describe('setWeather', () => {
    it('应该更新天气数据', () => {
      useItineraryStore.getState().setWeather(mockWeather)
      expect(useItineraryStore.getState().weather).toEqual(mockWeather)
    })
  })

  describe('setAccommodation', () => {
    it('应该更新住宿数据', () => {
      useItineraryStore.getState().setAccommodation(mockAccommodation)
      expect(useItineraryStore.getState().accommodation).toEqual(mockAccommodation)
    })
  })

  describe('setNightlife', () => {
    it('应该更新夜生活数据', () => {
      const nightlife = ['三里屯', '后海']
      useItineraryStore.getState().setNightlife(nightlife)
      expect(useItineraryStore.getState().nightlife).toEqual(nightlife)
    })
  })

  describe('setAttractionRefs', () => {
    it('应该更新景点参考数据', () => {
      useItineraryStore.getState().setAttractionRefs(mockAttractionRefs)
      expect(useItineraryStore.getState().attractionRefs).toEqual(mockAttractionRefs)
    })
  })

  describe('addAgentStep', () => {
    it('应该添加新步骤', () => {
      useItineraryStore.getState().addAgentStep(mockStep)
      expect(useItineraryStore.getState().agentSteps).toHaveLength(1)
      expect(useItineraryStore.getState().agentSteps[0]).toEqual(mockStep)
    })

    it('重复步骤应该更新而非重复添加', () => {
      useItineraryStore.getState().addAgentStep(mockStep)

      const updatedStep: Extract<SSEEvent, { type: 'step' }> = {
        data: { count: 10 },
        name: '查询景点',
        status: 'complete',
        step: 1,
        type: 'step',
      }
      useItineraryStore.getState().addAgentStep(updatedStep)

      expect(useItineraryStore.getState().agentSteps).toHaveLength(1)
      expect(useItineraryStore.getState().agentSteps[0].status).toBe('complete')
    })

    it('不同 step 编号应该分别添加', () => {
      useItineraryStore.getState().addAgentStep(mockStep)
      useItineraryStore.getState().addAgentStep({
        name: '生成行程',
        status: 'start',
        step: 2,
        type: 'step',
      })

      expect(useItineraryStore.getState().agentSteps).toHaveLength(2)
    })
  })

  describe('setCurrentAgentStep', () => {
    it('应该更新当前步骤编号', () => {
      useItineraryStore.getState().setCurrentAgentStep(3)
      expect(useItineraryStore.getState().currentAgentStep).toBe(3)
    })
  })

  describe('reset', () => {
    it('应该重置所有状态为初始值', () => {
      // 先设置各种数据
      useItineraryStore.setState({
        accommodation: mockAccommodation,
        agentSteps: [mockStep],
        attractionRefs: mockAttractionRefs,
        budgetBreakdown: mockBudget,
        currentAgentStep: 5,
        itinerary: mockItinerary,
        nightlife: ['三里屯'],
        tips: ['提示'],
        weather: mockWeather,
      })

      useItineraryStore.getState().reset()

      const state = useItineraryStore.getState()
      expect(state.itinerary).toEqual([])
      expect(state.budgetBreakdown).toBeNull()
      expect(state.tips).toEqual([])
      expect(state.weather).toBeNull()
      expect(state.accommodation).toEqual([])
      expect(state.nightlife).toEqual([])
      expect(state.attractionRefs).toEqual([])
      expect(state.agentSteps).toEqual([])
      expect(state.currentAgentStep).toBe(0)
    })
  })
})
