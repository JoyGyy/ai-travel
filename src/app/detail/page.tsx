'use client'

/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程，包含天气、住宿、每日景点、预算明细等模块。
 * 优先从本地缓存读取，缓存未命中时通过 SSE 流式调用推荐接口生成行程。
 */
import { ArrowLeft, Compass, MapPin, Share2, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useTravelRecommend } from '@/hooks/useTravelRecommend'
import { useItineraryStore } from '@/stores/itinerary'
import { loadItineraryCache } from '@/utils/storage'

import './style.css'

// 动态导入重型组件，减少初始包大小
const AccommodationCard = dynamic(
  () =>
    import('@/components/AccommodationCard').then((mod) => ({ default: mod.AccommodationCard })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted rounded-xl" />,
  },
)
const AgentSteps = dynamic(
  () => import('@/components/AgentSteps').then((mod) => ({ default: mod.AgentSteps })),
  {
    loading: () => <div className="h-48 animate-pulse bg-muted rounded-xl" />,
  },
)
const BudgetTable = dynamic(
  () => import('@/components/BudgetTable').then((mod) => ({ default: mod.BudgetTable })),
  {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded-xl" />,
  },
)
const SpotItem = dynamic(
  () => import('@/components/SpotItem').then((mod) => ({ default: mod.SpotItem })),
  {
    loading: () => <div className="h-24 animate-pulse bg-muted rounded-xl" />,
  },
)
const WeatherCard = dynamic(
  () => import('@/components/WeatherCard').then((mod) => ({ default: mod.WeatherCard })),
  {
    loading: () => <div className="h-40 animate-pulse bg-muted rounded-xl" />,
  },
)

export default function Detail() {
  /* ---------- 路由参数解析 ---------- */

  const router = useRouter()
  const searchParams = useSearchParams()

  const city = searchParams?.get('city') || ''
  const budget = Number(searchParams?.get('budget')) || 0
  const days = Number(searchParams?.get('days')) || 1

  const itinerary = useItineraryStore((s) => s.itinerary)
  const budgetBreakdown = useItineraryStore((s) => s.budgetBreakdown)
  const tips = useItineraryStore((s) => s.tips)
  const weather = useItineraryStore((s) => s.weather)
  const accommodation = useItineraryStore((s) => s.accommodation)
  const nightlife = useItineraryStore((s) => s.nightlife)
  const attractionRefs = useItineraryStore((s) => s.attractionRefs)
  const agentSteps = useItineraryStore((s) => s.agentSteps)
  const currentAgentStep = useItineraryStore((s) => s.currentAgentStep)
  const setItinerary = useItineraryStore((s) => s.setItinerary)
  const setBudgetBreakdown = useItineraryStore((s) => s.setBudgetBreakdown)
  const setTips = useItineraryStore((s) => s.setTips)
  const setWeather = useItineraryStore((s) => s.setWeather)
  const setAccommodation = useItineraryStore((s) => s.setAccommodation)
  const setNightlife = useItineraryStore((s) => s.setNightlife)
  const setAttractionRefs = useItineraryStore((s) => s.setAttractionRefs)
  const setCurrentAgentStep = useItineraryStore((s) => s.setCurrentAgentStep)

  /* ---------- 本地 UI 状态 ---------- */

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [showLoading, setShowLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { error: chatError, messages, sendMessage, status } = useTravelRecommend()
  const hasValidParams = Boolean(city && budget > 0 && days > 0)

  function findAttractionRef(spot?: string) {
    return attractionRefs.find((ref) => ref.name === spot)
  }

  function shareToCommunity() {
    router.push('/community/new')
  }

  /* ---------- 数据加载：优先缓存 → SSE 流式生成 ---------- */

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
      const cachedItinerary = cached.itinerary || []
      setItinerary(cachedItinerary)
      setBudgetBreakdown(cached.budgetBreakdown || null)
      setTips(cached.tips || [])
      setWeather(cached.weather || null)
      setAccommodation(cached.accommodation || [])
      setNightlife(cached.nightlife || [])
      setAttractionRefs(cached.attractionRefs || [])
      cacheTimer = setTimeout(() => {
        setActiveKeys(cachedItinerary[0]?.day ? [String(cachedItinerary[0].day)] : [])
        setShowLoading(false)
      }, 0)
      return () => {
        clearTimeout(resetTimer)
        clearTimeout(cacheTimer)
      }
    }

    useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })

    cacheTimer = setTimeout(() => {
      setShowLoading(false)
    }, 0)

    sendMessage({ text: `请为我规划 ${city} ${days} 天旅行，预算 ${budget} 元` })

    return () => {
      clearTimeout(resetTimer)
      clearTimeout(cacheTimer)
    }
  }, [
    budget,
    city,
    days,
    hasValidParams,
    sendMessage,
    setAccommodation,
    setAttractionRefs,
    setBudgetBreakdown,
    setCurrentAgentStep,
    setItinerary,
    setNightlife,
    setTips,
    setWeather,
  ])

  /* ========== 渲染 ========== */

  return (
    <main aria-labelledby="detail-title" className="detail-page">
      <div className="detail-page__hero travel-route-line">
        <div aria-hidden="true" className="detail-page__deco" />
        <button
          aria-label="返回上一页"
          className="detail-page__back"
          onClick={() => router.back()}
          type="button"
        >
          <ArrowLeft aria-hidden="true" />
        </button>
        <p className="detail-page__label">ITINERARY</p>
        <h1 className="detail-page__title" id="detail-title">
          {city || '旅行规划'}
        </h1>
        {hasValidParams ? (
          <p className="detail-page__subtitle">
            {days} 天行程 · 预算 ¥{budget}
          </p>
        ) : null}
      </div>

      <div className="detail-page__content">
        {showLoading ? (
          <div
            aria-label="AI 正在规划行程"
            aria-live="polite"
            className="detail-page__loading"
            role="status"
          >
            <div className="detail-page__loading-card">
              <div className="detail-page__loading-header">
                <span>AI 规划中</span>
                <button aria-label="关闭行程规划并返回" onClick={() => router.back()} type="button">
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="detail-page__loading-steps">
                <AgentSteps currentStep={currentAgentStep} steps={agentSteps} />
              </div>
              <div className="detail-page__loading-spinner">
                <div aria-hidden="true" className="detail-page__spinner" />
                <Compass aria-hidden="true" className="detail-page__spinner-icon" />
              </div>
              <p className="detail-page__loading-text">正在为你规划行程...</p>
            </div>
          </div>
        ) : null}

        {!showLoading && errorMessage ? (
          <div className="detail-page__empty" role="alert">
            <div className="detail-page__empty-icon">
              <MapPin aria-hidden="true" />
            </div>
            <p>{errorMessage}</p>
            <button onClick={() => router.push('/')} type="button">
              返回首页重新规划
            </button>
          </div>
        ) : null}

        {!showLoading && !errorMessage && itinerary.length === 0 ? (
          messages.length > 0 ? (
            <div className="detail-page__ai-content">
              <div className="detail-page__ai-header">
                <span>AI 生成的行程规划</span>
                {status !== 'ready' && <div aria-hidden="true" className="detail-page__spinner" />}
              </div>
              <div className="detail-page__ai-messages">
                {messages.map((message) => (
                  <div className="detail-page__ai-message" key={message.id}>
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return (
                          <div className="detail-page__ai-text" key={index}>
                            {part.text}
                          </div>
                        )
                      }
                      return null
                    })}
                  </div>
                ))}
              </div>
              {chatError && (
                <div className="detail-page__ai-error" role="alert">
                  <p>
                    生成失败：
                    {chatError.message}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="detail-page__empty" role="status">
              <div className="detail-page__empty-icon">
                <MapPin aria-hidden="true" />
              </div>
              <p>暂无行程数据</p>
              <button onClick={() => router.push('/chat')} type="button">
                咨询 AI 生成行程
              </button>
            </div>
          )
        ) : null}

        {!showLoading && !errorMessage && itinerary.length > 0 ? (
          <>
            {/* 摘要卡片 */}
            <div aria-label="行程摘要" className="detail-page__summary travel-ticket-edge">
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
                <span className="detail-page__summary-value detail-page__summary-value--accent">
                  ¥{budget}
                </span>
              </div>
            </div>

            {/* 天气 */}
            {weather ? (
              <section aria-labelledby="detail-weather-title" className="detail-page__section">
                <h2 className="detail-page__section-title" id="detail-weather-title">
                  <span aria-hidden="true" className="detail-page__dot" />
                  实时天气
                </h2>
                <WeatherCard weather={weather} />
              </section>
            ) : null}

            {/* 住宿推荐 */}
            {accommodation.length > 0 || nightlife.length > 0 ? (
              <section aria-label="住宿和夜生活推荐" className="detail-page__section">
                <AccommodationCard accommodation={accommodation} nightlife={nightlife} />
              </section>
            ) : null}

            {/* 每日行程 */}
            <section aria-labelledby="detail-itinerary-title" className="detail-page__section">
              <h2 className="detail-page__section-title" id="detail-itinerary-title">
                <span aria-hidden="true" className="detail-page__dot" />
                每日行程
              </h2>
              <div className="detail-page__itinerary">
                {itinerary.map((item) => {
                  const dayKey = String(item.day)
                  const panelId = `detail-day-panel-${dayKey}`
                  const isOpen = activeKeys.includes(dayKey)
                  return (
                    <div className="detail-page__day" key={item.day}>
                      <button
                        aria-controls={panelId}
                        aria-expanded={isOpen}
                        className="detail-page__day-header"
                        onClick={() =>
                          setActiveKeys((prev) =>
                            isOpen ? prev.filter((k) => k !== dayKey) : [...prev, dayKey],
                          )
                        }
                        type="button"
                      >
                        <span>{item.date}</span>
                        <span
                          aria-hidden="true"
                          className={`detail-page__day-arrow ${isOpen ? 'detail-page__day-arrow--open' : ''}`}
                        >
                          ▼
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="detail-page__day-body" id={panelId}>
                          {item.morning && (
                            <SpotItem
                              attractionRef={findAttractionRef(item.morning.spot)}
                              data={item.morning}
                              period="上午"
                            />
                          )}
                          {item.afternoon && (
                            <SpotItem
                              attractionRef={findAttractionRef(item.afternoon.spot)}
                              data={item.afternoon}
                              period="下午"
                            />
                          )}
                          {item.evening && (
                            <SpotItem
                              attractionRef={findAttractionRef(item.evening.spot)}
                              data={item.evening}
                              period="晚上"
                            />
                          )}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </section>

            {/* 预算明细 */}
            {budgetBreakdown ? <BudgetTable data={budgetBreakdown} /> : null}

            {/* 温馨提示 */}
            {tips.length > 0 ? (
              <section aria-labelledby="detail-tips-title" className="detail-page__section">
                <h2 className="detail-page__section-title" id="detail-tips-title">
                  <span aria-hidden="true" className="detail-page__dot" />
                  温馨提示
                </h2>
                <div className="detail-page__tips">
                  {tips.map((tip) => (
                    <div className="detail-page__tip" key={tip}>
                      <span aria-hidden="true" className="detail-page__tip-dot" />
                      {tip}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 分享与咨询操作 */}
            <div className="detail-page__actions">
              <button
                aria-label="分享到社区"
                className="detail-page__chat-btn"
                onClick={shareToCommunity}
                type="button"
              >
                <Share2 aria-hidden="true" />
                分享到社区
              </button>
              <button
                aria-label="咨询 AI 优化当前行程"
                className="detail-page__chat-btn"
                onClick={() => router.push('/chat')}
                type="button"
              >
                咨询 AI 优化行程
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
