import { beforeEach, describe, expect, it, vi } from 'vitest'

// 收集 SSE 写入的数据
const writtenData: string[] = []

function createMockRes() {
  return {
    write: vi.fn((data: string) => {
      writtenData.push(data)
    }),
    flush: vi.fn(),
    writable: true,
    destroyed: false,
  } as any
}

function parseSSEEvents(): any[] {
  return writtenData
    .filter(d => d.startsWith('data: '))
    .map(d => {
      try { return JSON.parse(d.slice(6)) }
      catch { return null }
    })
    .filter(Boolean)
}

describe('Agent 服务（Mock 模式）', () => {
  beforeEach(() => {
    writtenData.length = 0
    delete process.env.DEEPSEEK_API_KEY
    delete process.env.SILICONFLOW_API_KEY
  })

  async function runAgent(city: string, budget: number, days: number) {
    writtenData.length = 0
    const { executeAgent } = await import('../agent')
    await executeAgent(createMockRes(), { city, budget, days })
    return parseSSEEvents()
  }

  it('应依次发送 6 个步骤的 SSE 事件', async () => {
    const events = await runAgent('杭州', 5000, 3)
    const startSteps = events
      .filter(e => e.type === 'step' && e.status === 'start')
      .map(e => e.step)
    expect(startSteps).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('应发送 complete 事件并包含行程数据', async () => {
    const events = await runAgent('杭州', 5000, 3)
    const complete = events.find(e => e.type === 'complete')
    expect(complete).toBeDefined()
    expect(complete.data.city).toBe('杭州')
    expect(complete.data.days).toBe(3)
    expect(complete.data.totalBudget).toBe(5000)
    expect(complete.data.dailyItinerary.length).toBe(3)
    expect(complete.data.budgetBreakdown).toBeDefined()
    expect(complete.data.tips.length).toBeGreaterThan(0)
  })

  it('不存在的城市应返回空行程', async () => {
    const events = await runAgent('火星', 5000, 3)
    const complete = events.find(e => e.type === 'complete')
    expect(complete.data.dailyItinerary).toEqual([])
    expect(complete.data.tips[0]).toContain('暂不支持')
  })

  it('预算应按比例正确分配', async () => {
    const events = await runAgent('北京', 10000, 3)
    const complete = events.find(e => e.type === 'complete')
    const bd = complete.data.budgetBreakdown
    expect(bd.accommodation).toBe(3500)
    expect(bd.food).toBe(2500)
    expect(bd.transportation).toBe(1500)
    const total = bd.accommodation + bd.food + bd.transportation + bd.tickets + bd.other
    expect(total).toBe(10000)
  })

  it('行程应包含每天 3 个时段', async () => {
    const events = await runAgent('上海', 5000, 2)
    const complete = events.find(e => e.type === 'complete')
    const itinerary = complete.data.dailyItinerary
    expect(itinerary.length).toBe(2)
    for (const day of itinerary) {
      expect(day.morning.spot).toBeTruthy()
      expect(day.afternoon.spot).toBeTruthy()
      expect(day.evening.spot).toBeTruthy()
    }
  })

  it('parse_intent 步骤应返回正确的参数', async () => {
    const events = await runAgent('成都', 3000, 5)
    const step1 = events.find(
      e => e.type === 'step' && e.step === 1 && e.status === 'complete',
    )
    expect(step1.data.city).toBe('成都')
    expect(step1.data.days).toBe(5)
    expect(step1.data.budget).toBe(3000)
  })

  it('search_attractions 步骤应返回景点列表', async () => {
    const events = await runAgent('杭州', 5000, 3)
    const step2 = events.find(
      e => e.type === 'step' && e.step === 2 && e.status === 'complete',
    )
    expect(step2.data.count).toBeGreaterThan(0)
    expect(step2.data.sources.length).toBeGreaterThan(0)
  })
})
