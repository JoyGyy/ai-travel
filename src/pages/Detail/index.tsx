/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程，包括每日安排、预算明细和旅行提示
 */
import type { AgentStep, ItineraryResult } from '@/types'
import { CompassOutline, LeftOutline, LocationOutline } from 'antd-mobile-icons'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AccommodationCard } from '@/components/AccommodationCard'
import { AgentSteps } from '@/components/AgentSteps'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { WeatherCard } from '@/components/WeatherCard'
import { useSSE } from '@/hooks/useSSE'
import { useItineraryStore } from '@/stores/itinerary'
import { SharePopup } from '@/components/SharePopup'
import { loadItineraryCache, saveItineraryCache, saveToHistory } from '@/utils/storage'

export default function Detail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const city = searchParams.get('city') || ''
  const budget = Number(searchParams.get('budget')) || 0
  const days = Number(searchParams.get('days')) || 1

  const {
    itinerary, budgetBreakdown, tips, weather, accommodation, nightlife,
    agentSteps, currentAgentStep,
    setItinerary, setBudgetBreakdown, setTips, setWeather, setAccommodation, setNightlife,
    addAgentStep, setCurrentAgentStep,
  } = useItineraryStore()

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [showLoading, setShowLoading] = useState(true)
  const [shareVisible, setShareVisible] = useState(false)
  const { sendRequest, abort } = useSSE()

  // 每次参数变化时同步重置加载状态（在浏览器绘制前）
  useLayoutEffect(() => {
    if (city) setShowLoading(true)
  }, [city, budget, days])

  useEffect(() => {
    if (!city) return

    const cached = loadItineraryCache(city, budget, days)
    if (cached) {
      useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })
      setTimeout(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItinerary(cached.itinerary || [])
        setBudgetBreakdown(cached.budgetBreakdown || null)
        setTips(cached.tips || [])
        setWeather(cached.weather || null)
        setAccommodation(cached.accommodation || [])
        setNightlife(cached.nightlife || [])
        setShowLoading(false)
      }, 1500)
      return
    }

    // BUG FIX: 先中止上一次请求，防止竞态条件（新 effect 先于旧 cleanup 执行）
    abort()

    useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })

    let dataReceived = false

    sendRequest('/api/travel/recommend', { city, budget, days }, {
      onStep: (step: unknown) => {
        const agentStep = step as AgentStep
        setCurrentAgentStep(agentStep.step)
        if (agentStep.status === 'complete') addAgentStep(agentStep)
      },
      onComplete: (result: unknown) => {
        dataReceived = true
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
        // 数据到达后等一下再关闭，让内容有渲染时间
        setTimeout(() => setShowLoading(false), 800)
      },
      onFinally: () => {
        // 请求失败时（onComplete 未触发）才立即关闭
        if (!dataReceived) setShowLoading(false)
      },
    })

    return () => abort()
  }, [city, budget, days, sendRequest, abort, setItinerary, setBudgetBreakdown, setTips, addAgentStep, setCurrentAgentStep])

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
        {showLoading && (
          <div className="flex justify-center pt-6 px-4">
            <div
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(240, 232, 221, 0.3)' }}
            >
              {/* 卡片头部 */}
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <span className="text-[11px] font-semibold tracking-wider" style={{ color: 'var(--c-terracotta)' }}>
                  AI 规划中
                </span>
                <button
                  onClick={() => { abort(); navigate(-1) }}
                  className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors"
                  style={{ background: 'var(--c-paper)', color: 'var(--c-ink-light)', fontSize: '14px' }}
                >
                  ✕
                </button>
              </div>

              {/* Agent 步骤 */}
              <div className="px-5 pb-3">
                <AgentSteps steps={agentSteps} currentStep={currentAgentStep} />
              </div>

              {/* 加载动画 */}
              <div className="flex flex-col items-center pb-5 gap-3">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <div
                    className="absolute inset-0 rounded-full border-2 border-dotted"
                    style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)', animation: 'spin 1s linear infinite' }}
                  />
                  <CompassOutline style={{ fontSize: '16px', color: 'var(--c-terracotta)' }} />
                </div>
                <p className="text-[12px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>
                  正在为你规划行程...
                </p>

                {/* 进度点 */}
                <div className="flex items-center gap-1.5 mt-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1 h-1 rounded-full"
                      style={{
                        background: 'var(--c-terracotta)',
                        animation: 'pulseDot 1.4s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <style>{`
                @keyframes pulseDot {
                  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
                  40% { opacity: 1; transform: scale(1.2); }
                }
              `}</style>
            </div>
          </div>
        )}

        {!showLoading && itinerary.length === 0 && (
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

        {!showLoading && itinerary.length > 0 && (
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

            {/* 分享行程按钮 */}
            <div className="px-4 pt-5 md:px-8 md:max-w-4xl md:mx-auto">
              <button
                onClick={() => setShareVisible(true)}
                className="w-full h-10 rounded-xl text-[13px] font-medium cursor-pointer transition-all active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)' }}
              >
                分享行程
              </button>
            </div>

            {/* 咨询 AI 按钮 */}
            <div className="px-4 pt-3 pb-4 md:px-8 md:max-w-4xl md:mx-auto">
              <button
                onClick={() => navigate('/chat')}
                className="w-full h-10 rounded-xl text-[13px] font-medium cursor-pointer transition-all active:scale-[0.98]"
                style={{ background: 'transparent', border: '1px solid rgba(240, 232, 221, 0.6)', color: 'var(--c-ink-light)' }}
              >
                咨询 AI
              </button>
            </div>

            {/* 分享弹窗 */}
            <SharePopup
              visible={shareVisible}
              onClose={() => setShareVisible(false)}
              city={city}
              days={days}
              budget={budget}
              itinerary={itinerary}
            />
          </>
        )}
      </div>
    </div>
  )
}
