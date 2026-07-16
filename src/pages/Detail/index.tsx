/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程
 */
import type { WeatherResponse } from '@/types/api'
import type { ItineraryDay, BudgetBreakdown, Accommodation } from '@/stores/itinerary'
import { ArrowLeftOutlined, CloseOutlined, CompassOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AccommodationCard } from '@/components/AccommodationCard'
import { AgentSteps } from '@/components/AgentSteps'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { WeatherCard } from '@/components/WeatherCard'
import { useSSE } from '@/hooks/useSSE'
import { useItineraryStore } from '@/stores/itinerary'
import { loadItineraryCache, saveItineraryCache } from '@/utils/storage'
import './style.css'

interface ItineraryData {
  dailyItinerary?: ItineraryDay[]
  budgetBreakdown?: BudgetBreakdown | null
  tips?: string[]
  weather?: WeatherResponse | null
  accommodation?: Accommodation[]
  nightlife?: string[]
}

export default function Detail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const city = searchParams.get('city') || ''
  const budget = Number(searchParams.get('budget')) || 0
  const days = Number(searchParams.get('days')) || 1

  const {
    itinerary,
    budgetBreakdown,
    tips,
    weather,
    accommodation,
    nightlife,
    agentSteps,
    currentAgentStep,
    setItinerary,
    setBudgetBreakdown,
    setTips,
    setWeather,
    setAccommodation,
    setNightlife,
    addAgentStep,
    setCurrentAgentStep,
  } = useItineraryStore()

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [showLoading, setShowLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { sendRequest, abort } = useSSE()
  const hasValidParams = Boolean(city && budget > 0 && days > 0)

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout>
    let cacheTimer: ReturnType<typeof setTimeout>

    if (!hasValidParams) {
      resetTimer = setTimeout(() => {
        setShowLoading(false)
        setErrorMessage('缺少目的地或预算信息，请返回首页重新规划。')
      }, 0)
      return () => clearTimeout(resetTimer)
    }

    resetTimer = setTimeout(() => {
      setShowLoading(true)
      setErrorMessage('')
    }, 0)

    const cached = loadItineraryCache(city, budget, days)
    if (cached) {
      useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })
      setItinerary((cached.itinerary as ItineraryDay[]) || [])
      setBudgetBreakdown((cached.budgetBreakdown as BudgetBreakdown) || null)
      setTips((cached.tips as string[]) || [])
      setWeather((cached.weather as WeatherResponse) || null)
      setAccommodation((cached.accommodation as Accommodation[]) || [])
      setNightlife((cached.nightlife as string[]) || [])
      cacheTimer = setTimeout(setShowLoading, 0, false)
      return () => {
        clearTimeout(resetTimer)
        clearTimeout(cacheTimer)
      }
    }

    abort()
    useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })

    let dataReceived = false

    sendRequest('/api/travel/recommend', { city, budget, days }, {
      onStep: (step) => {
        setCurrentAgentStep(step.step)
        if (step.status === 'complete')
          addAgentStep(step)
      },
      onComplete: (data) => {
        dataReceived = true
        const completedData = data as ItineraryData
        const dailyItinerary = completedData.dailyItinerary || []
        const bd = completedData.budgetBreakdown || null
        const t = completedData.tips || []
        const w = completedData.weather || null
        const a = completedData.accommodation || []
        const n = completedData.nightlife || []
        setItinerary(dailyItinerary)
        setBudgetBreakdown(bd)
        setTips(t)
        setWeather(w)
        setAccommodation(a)
        setNightlife(n)
        saveItineraryCache(city, budget, days, { itinerary: dailyItinerary, budgetBreakdown: bd, tips: t, weather: w, accommodation: a, nightlife: n })
        setTimeout(setShowLoading, 500, false)
      },
      onError: (err) => {
        setErrorMessage(err.message || '生成行程失败，请稍后重试')
      },
      onFinally: () => {
        if (!dataReceived)
          setShowLoading(false)
      },
    }).catch((err) => {
      setErrorMessage(err.message || '生成行程失败，请稍后重试')
    })

    return () => {
      clearTimeout(resetTimer)
      abort()
    }
  }, [
    abort,
    addAgentStep,
    budget,
    city,
    days,
    hasValidParams,
    sendRequest,
    setAccommodation,
    setBudgetBreakdown,
    setCurrentAgentStep,
    setItinerary,
    setNightlife,
    setTips,
    setWeather,
  ])

  return (
    <main className="detail-page" aria-labelledby="detail-title">
      <div className="detail-page__hero">
        <div className="detail-page__deco" aria-hidden="true" />
        <button
          type="button"
          aria-label="返回上一页"
          onClick={() => navigate(-1)}
          className="detail-page__back"
        >
          <ArrowLeftOutlined aria-hidden="true" />
        </button>
        <p className="detail-page__label">ITINERARY</p>
        <h1 id="detail-title" className="detail-page__title">{city || '旅行规划'}</h1>
        {hasValidParams && (
          <p className="detail-page__subtitle">
            {days}
            {' '}
            天行程 · 预算 ¥
            {budget}
          </p>
        )}
      </div>

      <div className="detail-page__content">
        {showLoading && (
          <div className="detail-page__loading" role="status" aria-live="polite" aria-label="AI 正在规划行程">
            <div className="detail-page__loading-card">
              <div className="detail-page__loading-header">
                <span>AI 规划中</span>
                <button
                  type="button"
                  aria-label="关闭行程规划并返回"
                  onClick={() => {
                    abort()
                    navigate(-1)
                  }}
                >
                  <CloseOutlined aria-hidden="true" />
                </button>
              </div>
              <div className="detail-page__loading-steps">
                <AgentSteps steps={agentSteps} currentStep={currentAgentStep} />
              </div>
              <div className="detail-page__loading-spinner">
                <div className="detail-page__spinner" aria-hidden="true" />
                <CompassOutlined className="detail-page__spinner-icon" aria-hidden="true" />
              </div>
              <p className="detail-page__loading-text">正在为你规划行程...</p>
            </div>
          </div>
        )}

        {!showLoading && errorMessage && (
          <div className="detail-page__empty" role="alert">
            <div className="detail-page__empty-icon"><EnvironmentOutlined aria-hidden="true" /></div>
            <p>{errorMessage}</p>
            <button type="button" onClick={() => navigate('/')}>返回首页重新规划</button>
          </div>
        )}

        {!showLoading && !errorMessage && itinerary.length === 0 && (
          <div className="detail-page__empty" role="status">
            <div className="detail-page__empty-icon"><EnvironmentOutlined aria-hidden="true" /></div>
            <p>暂无行程数据</p>
            <button type="button" onClick={() => navigate('/chat')}>咨询 AI 生成行程</button>
          </div>
        )}

        {!showLoading && !errorMessage && itinerary.length > 0 && (
          <>
            {/* 摘要卡片 */}
            <div className="detail-page__summary" aria-label="行程摘要">
              <div className="detail-page__summary-item">
                <span className="detail-page__summary-label">目的地</span>
                <span className="detail-page__summary-value">{city}</span>
              </div>
              <div className="detail-page__summary-divider" />
              <div className="detail-page__summary-item">
                <span className="detail-page__summary-label">天数</span>
                <span className="detail-page__summary-value">
                  {days}
                  天
                </span>
              </div>
              <div className="detail-page__summary-divider" />
              <div className="detail-page__summary-item">
                <span className="detail-page__summary-label">预算</span>
                <span className="detail-page__summary-value detail-page__summary-value--accent">
                  ¥
                  {budget}
                </span>
              </div>
            </div>

            {/* 天气 */}
            {weather && (
              <section className="detail-page__section" aria-labelledby="detail-weather-title">
                <h2 id="detail-weather-title" className="detail-page__section-title">
                  <span className="detail-page__dot" aria-hidden="true" />
                  实时天气
                </h2>
                <WeatherCard weather={weather} />
              </section>
            )}

            {/* 住宿推荐 */}
            {(accommodation.length > 0 || nightlife.length > 0) && (
              <section className="detail-page__section" aria-label="住宿和夜生活推荐">
                <AccommodationCard accommodation={accommodation} nightlife={nightlife} />
              </section>
            )}

            {/* 每日行程 */}
            <section className="detail-page__section" aria-labelledby="detail-itinerary-title">
              <h2 id="detail-itinerary-title" className="detail-page__section-title">
                <span className="detail-page__dot" aria-hidden="true" />
                每日行程
              </h2>
              <div className="detail-page__itinerary">
                {itinerary.map((item) => {
                  const dayKey = String(item.day)
                  const panelId = `detail-day-panel-${dayKey}`
                  const isOpen = activeKeys.includes(dayKey)
                  return (
                    <div key={item.day} className="detail-page__day">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        onClick={() => setActiveKeys(prev => isOpen ? prev.filter(k => k !== dayKey) : [...prev, dayKey])}
                        className="detail-page__day-header"
                      >
                        <span>{item.date}</span>
                        <span className={`detail-page__day-arrow ${isOpen ? 'detail-page__day-arrow--open' : ''}`} aria-hidden="true">▼</span>
                      </button>
                      {isOpen && (
                        <div id={panelId} className="detail-page__day-body">
                          <SpotItem period="上午" data={item.morning} />
                          <SpotItem period="下午" data={item.afternoon} />
                          <SpotItem period="晚上" data={item.evening} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 预算明细 */}
            {budgetBreakdown && <BudgetTable data={budgetBreakdown} />}

            {/* 温馨提示 */}
            {tips.length > 0 && (
              <section className="detail-page__section" aria-labelledby="detail-tips-title">
                <h2 id="detail-tips-title" className="detail-page__section-title">
                  <span className="detail-page__dot" aria-hidden="true" />
                  温馨提示
                </h2>
                <div className="detail-page__tips">
                  {tips.map((tip, i) => (
                    <div key={i} className="detail-page__tip">
                      <span className="detail-page__tip-dot" aria-hidden="true" />
                      {tip}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 咨询 AI 按钮 */}
            <div className="detail-page__actions">
              <button type="button" onClick={() => navigate('/chat')} className="detail-page__chat-btn">咨询 AI</button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
