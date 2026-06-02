/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程，包括每日安排、预算明细和旅行提示
 */
import type { AgentStep, ItineraryResult } from '@/types'
import { Dialog, Toast } from 'antd-mobile'
import { CompassOutline, LeftOutline, LocationOutline } from 'antd-mobile-icons'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AccommodationCard } from '@/components/AccommodationCard'
import { AgentSteps } from '@/components/AgentSteps'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { WeatherCard } from '@/components/WeatherCard'
import { useSSE } from '@/hooks/useSSE'
import { useItineraryStore } from '@/stores/itinerary'
import { loadItineraryCache, saveItineraryCache, saveToCollections, saveToHistory } from '@/utils/storage'

export default function Detail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const city = searchParams.get('city') || ''
  const budget = Number(searchParams.get('budget')) || 0
  const days = Number(searchParams.get('days')) || 1

  const {
    itinerary, budgetBreakdown, tips, weather, accommodation, nightlife,
    agentSteps, currentAgentStep, isLoading,
    setItinerary, setBudgetBreakdown, setTips, setWeather, setAccommodation, setNightlife,
    addAgentStep, setCurrentAgentStep, setLoading,
  } = useItineraryStore()

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [saved, setSaved] = useState(false)
  const { sendRequest, abort } = useSSE()

  useEffect(() => {
    if (!city) return

    const cached = loadItineraryCache(city, budget, days)
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItinerary(cached.itinerary || [])
      setBudgetBreakdown(cached.budgetBreakdown || null)
      setTips(cached.tips || [])
      setWeather(cached.weather || null)
      setAccommodation(cached.accommodation || [])
      setNightlife(cached.nightlife || [])
      return
    }

    // BUG FIX: 先中止上一次请求，防止竞态条件（新 effect 先于旧 cleanup 执行）
    abort()

    setLoading(true)
    useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })

    sendRequest('/api/travel/recommend', { city, budget, days }, {
      onStep: (step: unknown) => {
        const agentStep = step as AgentStep
        setCurrentAgentStep(agentStep.step)
        if (agentStep.status === 'complete') addAgentStep(agentStep)
      },
      onComplete: (result: unknown) => {
        const data = result as ItineraryResult
        const dailyItinerary = data.dailyItinerary || []
        const bd = data.budgetBreakdown || null
        const t = data.tips || []
        const w = data.weather || null
        const a = data.accommodation || []
        const n = data.nightlife || []
        setItinerary(dailyItinerary)
        setBudgetBreakdown(bd)
        setTips(t)
        setWeather(w)
        setAccommodation(a)
        setNightlife(n)
        saveToHistory(data)
        saveItineraryCache(city, budget, days, { itinerary: dailyItinerary, budgetBreakdown: bd, tips: t, weather: w, accommodation: a, nightlife: n })
      },
      onFinally: () => setLoading(false),
    })

    return () => abort()
  }, [city, budget, days, sendRequest, abort, setItinerary, setBudgetBreakdown, setTips, addAgentStep, setCurrentAgentStep, setLoading])

  function handleSaveToCollections() {
    if (saved) return
    try {
      saveToCollections({ city, days, budget, date: new Date().toLocaleDateString('zh-CN'), itinerary, budgetBreakdown, tips, weather, accommodation, nightlife })
      setSaved(true)
      Toast.show({ content: '已保存到我的收藏', position: 'center' })
    }
    catch { Toast.show({ content: '保存失败', position: 'center' }) }
  }

  async function cancelPlan() {
    const result = await Dialog.confirm({ content: '确定要取消本次行程推荐吗？' })
    if (result) navigate(-1)
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)', paddingBottom: '24px' }}>
      {/* 头部 */}
      <div
        className="relative px-6 pt-5 pb-10 md:pt-8 md:pb-14"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3.5 left-4 w-9 h-9 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all active:scale-90"
          style={{ background: 'rgba(255, 252, 248, 0.12)' }}
        >
          <LeftOutline style={{ color: 'var(--c-cream)', fontSize: '17px' }} />
        </button>
        <p className="mt-2 mb-2 text-[10px] font-semibold tracking-[5px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)', opacity: 0.75 }}>ITINERARY</p>
        <h1 className="mb-2 text-[28px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {city}
        </h1>
        <p className="text-[12px] font-light" style={{ color: 'rgba(253, 246, 236, 0.5)' }}>
          {days} 天行程 &middot; 预算 ¥{budget}
        </p>
      </div>

      <div className="md:max-w-4xl md:mx-auto">
        {isLoading && (
          <div className="pt-5">
            <AgentSteps steps={agentSteps} currentStep={currentAgentStep} />
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-dotted" style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)', animation: 'spin 1s linear infinite' }} />
                <CompassOutline style={{ fontSize: '18px', color: 'var(--c-terracotta)' }} />
              </div>
              <p className="text-[13px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>AI 正在为你规划行程...</p>
            </div>
          </div>
        )}

        {!isLoading && itinerary.length === 0 && (
          <div className="flex flex-col items-center py-24 gap-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--c-sand)' }}>
              <LocationOutline style={{ fontSize: '40px', color: 'var(--c-gold)' }} />
            </div>
            <p className="text-[14px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>暂无行程数据</p>
            <button
              onClick={() => navigate('/chat')}
              className="px-6 py-2.5 rounded-xl border-none cursor-pointer text-sm font-medium transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)', color: '#fff', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)' }}
            >
              咨询 AI 生成行程
            </button>
          </div>
        )}

        {!isLoading && itinerary.length > 0 && (
          <>
            {/* 摘要卡片 */}
            <div
              className="flex items-center mx-4 -mt-6 px-5 py-4 relative z-10 rounded-2xl md:mx-auto md:px-8 md:py-5"
              style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(240, 232, 221, 0.3)' }}
            >
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--c-ink-light)', textTransform: 'uppercase' }}>目的地</span>
                <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>{city}</span>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--c-paper-dark)' }} />
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--c-ink-light)', textTransform: 'uppercase' }}>天数</span>
                <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>{days}天</span>
              </div>
              <div className="w-px h-8" style={{ background: 'var(--c-paper-dark)' }} />
              <div className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium tracking-wider" style={{ color: 'var(--c-ink-light)', textTransform: 'uppercase' }}>预算</span>
                <span className="text-[15px] font-semibold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-terracotta)' }}>¥{budget}</span>
              </div>
            </div>

            {/* 天气卡片 */}
            {weather && (
              <div className="pt-5">
                <div className="flex items-center gap-2.5 px-5 pb-3" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--c-ink)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
                  <span>实时天气</span>
                </div>
                <WeatherCard weather={weather} />
              </div>
            )}

            {/* 住宿与夜生活推荐 */}
            {(accommodation.length > 0 || nightlife.length > 0) && (
              <div className="pt-5">
                <AccommodationCard accommodation={accommodation} nightlife={nightlife} />
              </div>
            )}

            {/* 每日行程 */}
            <div className="flex items-center gap-2.5 px-5 pt-7 pb-3" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--c-ink)' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
              <span>每日行程</span>
            </div>
            <div
              className="mx-4 rounded-2xl overflow-hidden md:mx-auto md:max-w-4xl"
              style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
            >
              {itinerary.map(item => (
                <div key={item.day} className="border-b last:border-b-0" style={{ borderColor: 'rgba(240, 232, 221, 0.5)' }}>
                  <button
                    onClick={() => setActiveKeys(prev => prev.includes(String(item.day)) ? prev.filter(k => k !== String(item.day)) : [...prev, String(item.day)])}
                    className="w-full flex items-center justify-between px-5 py-3.5 text-left border-none bg-transparent cursor-pointer transition-colors"
                    style={{ background: 'var(--c-white)' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--c-ink)' }}>{item.date}</span>
                    <span className="text-[10px] transition-transform duration-200" style={{ color: 'var(--c-ink-light)', transform: activeKeys.includes(String(item.day)) ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      ▼
                    </span>
                  </button>
                  {activeKeys.includes(String(item.day)) && (
                    <div className="px-4 pb-4 md:grid md:grid-cols-2 md:gap-3">
                      <SpotItem period="上午" data={item.morning} />
                      <SpotItem period="下午" data={item.afternoon} />
                      <SpotItem period="晚上" data={item.evening} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {budgetBreakdown && <BudgetTable data={budgetBreakdown} />}

            {tips.length > 0 && (
              <div className="pb-2">
                <div className="flex items-center gap-2.5 px-5 pt-6 pb-3" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--c-ink)' }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
                  <span>温馨提示</span>
                </div>
                <div
                  className="mx-4 p-4 rounded-2xl md:mx-auto md:max-w-4xl md:p-5"
                  style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
                >
                  {tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-[13px] leading-relaxed py-1.5" style={{ color: 'var(--c-ink-light)' }}>
                      <span className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0" style={{ background: 'var(--c-gold)' }} />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col gap-2 px-4 pt-5 pb-4 md:px-8 md:max-w-4xl md:mx-auto">
              <div className="flex gap-2">
                <button
                  onClick={cancelPlan}
                  className="flex-1 h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all active:scale-[0.98]"
                  style={{ background: 'var(--c-paper-dark)', color: 'var(--c-ink-light)', boxShadow: 'var(--shadow-xs)' }}
                >
                  取消推荐
                </button>
                <button
                  onClick={handleSaveToCollections}
                  className="flex-1 h-11 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all active:scale-[0.98]"
                  style={{
                    background: saved ? 'var(--c-paper)' : 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
                    color: saved ? 'var(--c-forest)' : '#fff',
                    boxShadow: saved ? 'none' : '0 2px 8px rgba(99, 102, 241, 0.2)',
                    border: saved ? '1px solid var(--c-forest)' : 'none',
                  }}
                >
                  {saved ? '✓ 已收藏' : '保存行程'}
                </button>
              </div>
              <button
                onClick={() => navigate('/chat')}
                className="w-full h-10 rounded-xl text-[13px] font-medium cursor-pointer transition-all active:scale-[0.98]"
                style={{ background: 'transparent', border: '1px solid rgba(240, 232, 221, 0.6)', color: 'var(--c-ink-light)' }}
              >
                咨询 AI
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
