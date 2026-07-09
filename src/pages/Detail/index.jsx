/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程
 */
import { ArrowLeftOutlined, EnvironmentOutlined, CompassOutlined } from '@ant-design/icons'
import { useEffect, useLayoutEffect, useState } from 'react'
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

export default function Detail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const city = searchParams.get('city') || ''
  const budget = Number(searchParams.get('budget')) || 0
  const days = Number(searchParams.get('days')) || 1

  const {
    itinerary, budgetBreakdown, tips, weather, accommodation, nightlife,
    agentSteps, currentAgentStep,
    setItinerary, setBudgetBreakdown, setTips, setWeather,
    setAccommodation, setNightlife, addAgentStep, setCurrentAgentStep,
  } = useItineraryStore()

  const [activeKeys, setActiveKeys] = useState([])
  const [showLoading, setShowLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { sendRequest, abort } = useSSE()

  // URL 参数变化时重置加载状态
  useLayoutEffect(() => {
    if (city) {
      // 同步切换到加载态并清空旧错误，避免新参数首帧展示旧状态
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLoading(true)
      setErrorMessage('')
    }
  }, [city, budget, days])

  useEffect(() => {
    if (!city) return

    const cached = loadItineraryCache(city, budget, days)
    if (cached) {
      useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })
      setTimeout(() => {
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

    abort()
    useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })

    let dataReceived = false

    sendRequest('/api/travel/recommend', { city, budget, days }, {
      onStep: (step) => {
        setCurrentAgentStep(step.step)
        if (step.status === 'complete') addAgentStep(step)
      },
      onComplete: (data) => {
        dataReceived = true
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
        saveItineraryCache(city, budget, days, { itinerary: dailyItinerary, budgetBreakdown: bd, tips: t, weather: w, accommodation: a, nightlife: n })
        setTimeout(setShowLoading, 800, false)
      },
      onError: (err) => {
        setErrorMessage(err.message || '生成行程失败，请稍后重试')
      },
      onFinally: () => {
        if (!dataReceived) setShowLoading(false)
      },
    }).catch((err) => {
      setErrorMessage(err.message || '生成行程失败，请稍后重试')
    })

    return () => abort()
  }, [city, budget, days]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="detail-page">
      <div className="detail-page__hero">
        <div className="detail-page__deco" />
        <button onClick={() => navigate(-1)} className="detail-page__back">
          <ArrowLeftOutlined />
        </button>
        <p className="detail-page__label">ITINERARY</p>
        <h1 className="detail-page__title">{city}</h1>
        <p className="detail-page__subtitle">{days} 天行程 · 预算 ¥{budget}</p>
      </div>

      <div className="detail-page__content">
        {showLoading && (
          <div className="detail-page__loading">
            <div className="detail-page__loading-card">
              <div className="detail-page__loading-header">
                <span>AI 规划中</span>
                <button onClick={() => { abort(); navigate(-1) }}>✕</button>
              </div>
              <div className="detail-page__loading-steps">
                <AgentSteps steps={agentSteps} currentStep={currentAgentStep} />
              </div>
              <div className="detail-page__loading-spinner">
                <div className="detail-page__spinner" />
                <CompassOutlined className="detail-page__spinner-icon" />
              </div>
              <p className="detail-page__loading-text">正在为你规划行程...</p>
            </div>
          </div>
        )}

        {!showLoading && errorMessage && (
          <div className="detail-page__empty">
            <div className="detail-page__empty-icon"><EnvironmentOutlined /></div>
            <p>{errorMessage}</p>
            <button onClick={() => navigate('/chat')}>咨询 AI 生成行程</button>
          </div>
        )}

        {!showLoading && !errorMessage && itinerary.length === 0 && (
          <div className="detail-page__empty">
            <div className="detail-page__empty-icon"><EnvironmentOutlined /></div>
            <p>暂无行程数据</p>
            <button onClick={() => navigate('/chat')}>咨询 AI 生成行程</button>
          </div>
        )}

        {!showLoading && !errorMessage && itinerary.length > 0 && (
          <>
            {/* 摘要卡片 */}
            <div className="detail-page__summary">
              <div className="detail-page__summary-item">
                <span className="detail-page__summary-label">目的地</span>
                <span className="detail-page__summary-value">{city}</span>
              </div>
              <div className="detail-page__summary-divider" />
              <div className="detail-page__summary-item">
                <span className="detail-page__summary-label">天数</span>
                <span className="detail-page__summary-value">{days}天</span>
              </div>
              <div className="detail-page__summary-divider" />
              <div className="detail-page__summary-item">
                <span className="detail-page__summary-label">预算</span>
                <span className="detail-page__summary-value detail-page__summary-value--accent">¥{budget}</span>
              </div>
            </div>

            {/* 天气 */}
            {weather && (
              <div className="detail-page__section">
                <div className="detail-page__section-title"><div className="detail-page__dot" />实时天气</div>
                <WeatherCard weather={weather} />
              </div>
            )}

            {/* 住宿推荐 */}
            {(accommodation.length > 0 || nightlife.length > 0) && (
              <div className="detail-page__section">
                <AccommodationCard accommodation={accommodation} nightlife={nightlife} />
              </div>
            )}

            {/* 每日行程 */}
            <div className="detail-page__section">
              <div className="detail-page__section-title"><div className="detail-page__dot" />每日行程</div>
              <div className="detail-page__itinerary">
                {itinerary.map(item => (
                  <div key={item.day} className="detail-page__day">
                    <button
                      onClick={() => setActiveKeys(prev => prev.includes(String(item.day)) ? prev.filter(k => k !== String(item.day)) : [...prev, String(item.day)])}
                      className="detail-page__day-header"
                    >
                      <span>{item.date}</span>
                      <span className={`detail-page__day-arrow ${activeKeys.includes(String(item.day)) ? 'detail-page__day-arrow--open' : ''}`}>▼</span>
                    </button>
                    {activeKeys.includes(String(item.day)) && (
                      <div className="detail-page__day-body">
                        <SpotItem period="上午" data={item.morning} />
                        <SpotItem period="下午" data={item.afternoon} />
                        <SpotItem period="晚上" data={item.evening} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 预算明细 */}
            {budgetBreakdown && <BudgetTable data={budgetBreakdown} />}

            {/* 温馨提示 */}
            {tips.length > 0 && (
              <div className="detail-page__section">
                <div className="detail-page__section-title"><div className="detail-page__dot" />温馨提示</div>
                <div className="detail-page__tips">
                  {tips.map((tip, i) => (
                    <div key={i} className="detail-page__tip">
                      <span className="detail-page__tip-dot" />
                      {tip}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 咨询 AI 按钮 */}
            <div className="detail-page__actions">
              <button onClick={() => navigate('/chat')} className="detail-page__chat-btn">咨询 AI</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
