import type { SSEEvent, WeatherResponse } from '@/types/api'

import type { Accommodation, AttractionRef, BudgetBreakdown, ItineraryDay } from './itinerary'

import { getItineraryTemporal, useItineraryStore } from './itinerary'

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
      isEditing: false,
      itinerary: [],
      nightlife: [],
      tips: [],
      weather: null,
    })
    // 清空 undo/redo 历史
    getItineraryTemporal().clear()
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

  // ========== 行程编辑操作 ==========

  describe('行程编辑操作', () => {
    const editableItinerary: ItineraryDay[] = [
      {
        day: 1,
        spots: [
          { description: '皇家宫殿', duration: '3小时', name: '故宫' },
          { description: '皇家园林', duration: '2小时', name: '颐和园' },
        ],
        title: '第一天',
      },
    ]

    beforeEach(() => {
      useItineraryStore.getState().setItinerary(editableItinerary)
    })

    describe('setEditing', () => {
      it('应该切换编辑模式', () => {
        useItineraryStore.getState().setEditing(true)
        expect(useItineraryStore.getState().isEditing).toBe(true)

        useItineraryStore.getState().setEditing(false)
        expect(useItineraryStore.getState().isEditing).toBe(false)
      })
    })

    describe('addSpotToDay', () => {
      it('应该向指定天添加景点', () => {
        useItineraryStore
          .getState()
          .addSpotToDay(0, { description: '胡同漫步', duration: '1小时', name: '南锣鼓巷' })

        const spots = useItineraryStore.getState().itinerary[0].spots
        expect(spots).toHaveLength(3)
        expect(spots[2].name).toBe('南锣鼓巷')
      })
    })

    describe('removeSpotFromDay', () => {
      it('应该删除指定天的指定景点', () => {
        useItineraryStore.getState().removeSpotFromDay(0, 0)

        const spots = useItineraryStore.getState().itinerary[0].spots
        expect(spots).toHaveLength(1)
        expect(spots[0].name).toBe('颐和园')
      })

      it('删除不存在的索引应该无副作用', () => {
        useItineraryStore.getState().removeSpotFromDay(0, 99)
        expect(useItineraryStore.getState().itinerary[0].spots).toHaveLength(2)
      })
    })

    describe('updateSpot', () => {
      it('应该更新指定景点的信息', () => {
        useItineraryStore.getState().updateSpot(0, 0, { duration: '4小时' })

        const spot = useItineraryStore.getState().itinerary[0].spots[0]
        expect(spot.duration).toBe('4小时')
        expect(spot.name).toBe('故宫') // 未更新的字段保持不变
      })
    })

    describe('moveSpot', () => {
      it('应该在同一天内移动景点位置', () => {
        useItineraryStore.getState().moveSpot(0, 0, 0, 1)

        const spots = useItineraryStore.getState().itinerary[0].spots
        expect(spots[0].name).toBe('颐和园')
        expect(spots[1].name).toBe('故宫')
      })

      it('跨天移动景点', () => {
        useItineraryStore.getState().setItinerary([
          {
            day: 1,
            spots: [{ description: '皇家宫殿', duration: '3小时', name: '故宫' }],
            title: '第一天',
          },
          {
            day: 2,
            spots: [{ description: '水乡古镇', duration: '4小时', name: '乌镇' }],
            title: '第二天',
          },
        ])

        // 把第 1 天的故宫移到第 2 天末尾
        useItineraryStore.getState().moveSpot(0, 0, 1, 1)

        const state = useItineraryStore.getState()
        expect(state.itinerary[0].spots).toHaveLength(0)
        expect(state.itinerary[1].spots).toHaveLength(2)
        expect(state.itinerary[1].spots[1].name).toBe('故宫')
      })
    })
  })

  // ========== Undo/Redo ==========

  describe('Undo/Redo 历史记录', () => {
    it('进入编辑模式保存快照后，修改行程可以撤销', () => {
      // 准备行程数据
      useItineraryStore.getState().setItinerary([
        {
          day: 1,
          spots: [{ description: '皇家宫殿', duration: '3小时', name: '故宫' }],
          title: '第一天',
        },
      ])

      const temporal = getItineraryTemporal()

      // 进入编辑模式：保存当前状态快照
      temporal.snapshot()
      useItineraryStore.getState().setEditing(true)

      // 修改行程：删除景点
      useItineraryStore.getState().removeSpotFromDay(0, 0)
      expect(useItineraryStore.getState().itinerary[0].spots).toHaveLength(0)

      // 可以撤销
      expect(temporal.canUndo()).toBe(true)

      // 撤销：恢复被删除的景点
      temporal.undo()
      expect(useItineraryStore.getState().itinerary[0].spots).toHaveLength(1)
      expect(useItineraryStore.getState().itinerary[0].spots[0].name).toBe('故宫')

      // 撤销后可以重做
      expect(temporal.canRedo()).toBe(true)
      temporal.redo()
      expect(useItineraryStore.getState().itinerary[0].spots).toHaveLength(0)
    })

    it('撤销后执行新操作会清空重做栈', () => {
      useItineraryStore.getState().setItinerary([
        {
          day: 1,
          spots: [{ description: '皇家宫殿', duration: '3小时', name: '故宫' }],
          title: '第一天',
        },
      ])

      const temporal = getItineraryTemporal()
      temporal.snapshot()

      // 第一次修改：删除
      useItineraryStore.getState().removeSpotFromDay(0, 0)
      temporal.snapshot()

      // 撤销一次
      temporal.undo()

      // 执行新操作：添加景点
      useItineraryStore.getState().addSpotToDay(0, {
        description: '皇家园林',
        duration: '2小时',
        name: '颐和园',
      })

      // 重做栈被清空
      expect(temporal.canRedo()).toBe(false)
      expect(useItineraryStore.getState().itinerary[0].spots[0].name).toBe('颐和园')
    })

    it('canUndo/canRedo 在空历史时返回 false', () => {
      const temporal = getItineraryTemporal()
      temporal.clear()

      expect(temporal.canUndo()).toBe(false)
      expect(temporal.canRedo()).toBe(false)
    })

    it('清空历史后无法撤销', () => {
      useItineraryStore.getState().setItinerary([
        {
          day: 1,
          spots: [{ description: '皇家宫殿', duration: '3小时', name: '故宫' }],
          title: '第一天',
        },
      ])

      const temporal = getItineraryTemporal()
      temporal.snapshot()
      useItineraryStore.getState().removeSpotFromDay(0, 0)

      expect(temporal.canUndo()).toBe(true)

      temporal.clear()
      expect(temporal.canUndo()).toBe(false)
    })
  })
})
