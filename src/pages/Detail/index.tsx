/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程，包括每日安排、预算明细和旅行提示
 */
import type { AgentStep, BudgetBreakdown, DayItinerary, ItineraryResult } from '@/types'
import { Dialog, Toast } from 'antd-mobile'
import { CompassOutline, LeftOutline, LocationOutline } from 'antd-mobile-icons'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AgentSteps } from '@/components/AgentSteps'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { useSSE } from '@/hooks/useSSE'
import { loadItineraryCache, saveItineraryCache, saveToCollections, saveToHistory } from '@/utils/storage'

export default function Detail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams() // 获取 URL 查询参数

  // 从 URL 参数中提取行程配置
  const city = searchParams.get('city') || ''
  const budget = Number(searchParams.get('budget')) || 0
  const days = Number(searchParams.get('days')) || 1

  // 行程数据状态
  const [itinerary, setItinerary] = useState<DayItinerary[]>([]) // 每日行程
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null) // 预算明细
  const [tips, setTips] = useState<string[]>([]) // 旅行提示
  const [activeKeys, setActiveKeys] = useState<string[]>([]) // 展开的日期面板
  const [isLoading, setIsLoading] = useState(false) // 加载状态
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]) // Agent 执行步骤
  const [currentAgentStep, setCurrentAgentStep] = useState<number>(0) // 当前 Agent 步骤

  const { sendRequest, abort } = useSSE() // SSE 请求和中止函数

  /**
   * 加载行程数据
   * 优先从缓存加载，缓存未命中则请求 AI 接口
   */
  useEffect(() => {
    if (!city)
      return // 无城市参数时不加载

    // 尝试从缓存加载
    const cached = loadItineraryCache(city, budget, days)
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItinerary(cached.itinerary || [])
      setBudgetBreakdown(cached.budgetBreakdown || null)
      setTips(cached.tips || [])
      return // 缓存命中，直接返回
    }

    // 缓存未命中，请求 AI 接口
    setIsLoading(true)
    setAgentSteps([])
    setCurrentAgentStep(0)
    sendRequest('/api/travel/recommend', { city, budget, days }, {
      onStep: (step: unknown) => {
        const agentStep = step as AgentStep
        setCurrentAgentStep(agentStep.step)
        if (agentStep.status === 'complete') {
          setAgentSteps(prev => {
            const exists = prev.find(s => s.step === agentStep.step)
            if (exists) {
              return prev.map(s => s.step === agentStep.step ? agentStep : s)
            }
            return [...prev, agentStep]
          })
        }
      },
      onComplete: (result: unknown) => {
        // 将未知类型断言为 ItineraryResult
        const data = result as ItineraryResult
        const dailyItinerary = data.dailyItinerary || []
        const bd = data.budgetBreakdown || null
        const t = data.tips || []
        // 更新状态
        setItinerary(dailyItinerary)
        setBudgetBreakdown(bd)
        setTips(t)
        // 保存到历史记录和缓存
        saveToHistory(data)
        saveItineraryCache(city, budget, days, { itinerary: dailyItinerary, budgetBreakdown: bd, tips: t })
      },
      onFinally: () => setIsLoading(false), // 请求完成，取消加载状态
    })

    // 组件卸载时中止请求
    return () => abort()
  }, [city, budget, days, sendRequest, abort]) // 依赖项：当参数变化时重新加载

  /**
   * 保存行程到收藏
   */
  function handleSaveToCollections() {
    try {
      saveToCollections({
        city,
        days,
        budget,
        date: new Date().toLocaleDateString('zh-CN'),
        itinerary,
        budgetBreakdown,
        tips,
      })
      Toast.show({ content: '已保存到我的收藏' })
    }
    catch {
      Toast.show({ content: '保存失败' })
    }
  }

  /**
   * 取消行程规划
   * 弹出确认对话框后返回上一页
   */
  async function cancelPlan() {
    const result = await Dialog.confirm({ content: '确定要取消本次行程推荐吗？' })
    if (result)
      navigate(-1)
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)', paddingBottom: '24px' }}>
      {/* Hero 区域 - 全宽展示 */}
      <div
        className="relative px-6 pt-5 pb-9 md:pt-8 md:pb-14"
        style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #2d6a4f 100%)' }}
      >
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3.5 left-4 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 hover:scale-110"
          style={{ background: 'rgba(255, 252, 248, 0.15)' }}
        >
          <LeftOutline style={{ color: 'var(--c-cream)', fontSize: '18px' }} />
        </button>
        <p className="mt-2 mb-2 text-[11px] font-semibold tracking-[4px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)' }}>ITINERARY</p>
        <h1 className="mb-2 text-[32px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>{city}</h1>
        <p className="text-sm font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>
          {days}
          {' '}
          天行程 &middot; 预算 ¥
          {budget}
        </p>
      </div>

      {/* 内容区域 - 限宽居中 */}
      <div className="md:max-w-4xl md:mx-auto">
      {/* 加载状态 - Agent 步骤可视化 */}
      {isLoading && (
        <div className="pt-5">
          <AgentSteps steps={agentSteps} currentStep={currentAgentStep} />
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dotted" style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)', animation: 'spin 1s linear infinite' }} />
              <CompassOutline style={{ fontSize: '18px', color: 'var(--c-terracotta)' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', color: 'var(--c-ink-light)' }}>AI 正在为你规划行程...</p>
          </div>
        </div>
      )}

      {/* 空状态 - 无行程数据时显示 */}
      {!isLoading && itinerary.length === 0 && (
        <div className="flex flex-col items-center py-20 gap-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--c-sand)' }}>
            <LocationOutline style={{ fontSize: '48px', color: 'var(--c-gold)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', color: 'var(--c-ink-light)' }}>暂无行程数据</p>
          <button onClick={() => navigate('/chat')} className="px-6 py-2.5 rounded-full border-none cursor-pointer text-sm font-medium" style={{ background: 'var(--c-terracotta)', color: '#fff' }}>
            咨询 AI 生成行程
          </button>
        </div>
      )}

      {/* 行程内容 - 有数据时显示 */}
      {!isLoading && itinerary.length > 0 && (
        <>
          {/* 行程概览条 - 显示目的地、天数、预算 */}
          <div
            className="flex items-center mx-4 -mt-5 px-5 py-4 relative z-10 rounded-2xl md:mx-auto md:px-8 md:py-5 md:max-w-4xl transition-shadow duration-200"
            style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}
          >
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--c-ink-light)' }}>目的地</span>
              <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>{city}</span>
            </div>
            <div className="w-px h-7" style={{ background: 'var(--c-paper-dark)' }} />
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--c-ink-light)' }}>天数</span>
              <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>
                {days}
                天
              </span>
            </div>
            <div className="w-px h-7" style={{ background: 'var(--c-paper-dark)' }} />
            <div className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[11px] font-medium" style={{ color: 'var(--c-ink-light)' }}>预算</span>
              <span className="text-base font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-terracotta)' }}>
                ¥
                {budget}
              </span>
            </div>
          </div>

          {/* 每日行程列表 */}
          <div className="flex items-center gap-2 px-5 pt-6 pb-3" style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--c-ink)' }}>
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>每日行程</span>
          </div>
          <div className="mx-4 rounded-2xl overflow-hidden md:mx-auto md:max-w-4xl md:px-0" style={{ background: 'var(--c-white)' }}>
            {itinerary.map(item => (
              <div key={item.day} className="border-b last:border-b-0" style={{ borderColor: 'var(--c-paper-dark)' }}>
                {/* 日期标题 - 点击展开/收起 */}
                <button
                  onClick={() => {
                    setActiveKeys(prev =>
                      prev.includes(String(item.day))
                        ? prev.filter(k => k !== String(item.day)) // 已展开则收起
                        : [...prev, String(item.day)], // 未展开则展开
                    )
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 text-left border-none bg-transparent cursor-pointer"
                  style={{ background: 'var(--c-white)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--c-ink)' }}>{item.date}</span>
                  {/* 展开/收起图标 */}
                  <span className="text-xs transition-transform duration-200" style={{ color: '#999', transform: activeKeys.includes(String(item.day)) ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>
                {/* 展开的行程详情 */}
                {activeKeys.includes(String(item.day)) && (
                  <div className="px-5 pb-4 md:grid md:grid-cols-2 md:gap-3">
                    <SpotItem period="上午" data={item.morning} />
                    <SpotItem period="下午" data={item.afternoon} />
                    <SpotItem period="晚上" data={item.evening} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 预算明细表格 */}
          {budgetBreakdown && <BudgetTable data={budgetBreakdown} />}

          {/* 旅行提示 */}
          {tips.length > 0 && (
            <div className="pb-2">
              <div className="flex items-center gap-2 px-5 pt-6 pb-3" style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--c-ink)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
                <span>温馨提示</span>
              </div>
              <div className="mx-4 p-4 rounded-2xl md:mx-auto md:max-w-4xl md:p-6" style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)' }}>
                {tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed py-1.5" style={{ color: 'var(--c-ink-light)' }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ background: 'var(--c-gold)' }} />
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 操作按钮区域 */}
          <div className="flex flex-col gap-2.5 px-4 pt-5 md:px-8 md:max-w-4xl md:mx-auto">
            <div className="flex gap-2.5">
              {/* 取消推荐按钮 */}
              <button onClick={cancelPlan} className="flex-1 h-[46px] rounded-full text-[15px] font-semibold border-none cursor-pointer transition-all duration-200 active:scale-[0.98]" style={{ background: 'var(--c-paper-dark)', color: 'var(--c-ink-light)', boxShadow: 'var(--shadow-sm)' }}>
                取消推荐
              </button>
              <button onClick={handleSaveToCollections} className="flex-1 h-[46px] rounded-full text-[15px] font-semibold border-none cursor-pointer text-white transition-all duration-200 active:scale-[0.98]" style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)' }}>
                保存行程
              </button>
            </div>
            {/* 咨询 AI 按钮 */}
            <button onClick={() => navigate('/chat')} className="w-full h-[42px] rounded-full text-sm font-medium cursor-pointer transition-all duration-200 active:scale-[0.98]" style={{ background: 'transparent', border: '1px solid var(--c-paper-dark)', color: 'var(--c-ink-light)' }}>
              咨询 AI
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  )
}
