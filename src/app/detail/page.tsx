'use client'

/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程，包含天气、住宿、每日景点、预算明细等模块。
 * 优先从本地缓存读取，缓存未命中时通过 SSE 流式调用推荐接口生成行程。
 * 支持行程编辑模式和 Undo/Redo。
 */
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Compass,
  Edit3,
  MapPin,
  Redo,
  Share2,
  Trash2,
  Undo,
  X,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useTravelRecommend } from '@/hooks/useTravelRecommend'
import { getItineraryTemporal, useItineraryStore } from '@/stores/itinerary'
import { loadItineraryCache } from '@/utils/storage'

// 动态导入重型组件，减少初始包大小
const AccommodationCard = dynamic(
  () =>
    import('@/components/AccommodationCard').then((mod) => ({ default: mod.AccommodationCard })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted" />,
  },
)
const AgentSteps = dynamic(
  () => import('@/components/AgentSteps').then((mod) => ({ default: mod.AgentSteps })),
  {
    loading: () => <div className="h-48 animate-pulse rounded-xl bg-muted" />,
  },
)
const BudgetTable = dynamic(
  () => import('@/components/BudgetTable').then((mod) => ({ default: mod.BudgetTable })),
  {
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
  },
)
const SpotItem = dynamic(
  () => import('@/components/SpotItem').then((mod) => ({ default: mod.SpotItem })),
  {
    loading: () => <div className="h-24 animate-pulse rounded-xl bg-muted" />,
  },
)
const WeatherCard = dynamic(
  () => import('@/components/WeatherCard').then((mod) => ({ default: mod.WeatherCard })),
  {
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted" />,
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
  const isEditing = useItineraryStore((s) => s.isEditing)
  const setItinerary = useItineraryStore((s) => s.setItinerary)
  const setBudgetBreakdown = useItineraryStore((s) => s.setBudgetBreakdown)
  const setTips = useItineraryStore((s) => s.setTips)
  const setWeather = useItineraryStore((s) => s.setWeather)
  const setAccommodation = useItineraryStore((s) => s.setAccommodation)
  const setNightlife = useItineraryStore((s) => s.setNightlife)
  const setAttractionRefs = useItineraryStore((s) => s.setAttractionRefs)
  const setCurrentAgentStep = useItineraryStore((s) => s.setCurrentAgentStep)
  const setEditing = useItineraryStore((s) => s.setEditing)
  const removeSpotFromDay = useItineraryStore((s) => s.removeSpotFromDay)
  const moveSpot = useItineraryStore((s) => s.moveSpot)

  /* ---------- 本地 UI 状态 ---------- */

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [showLoading, setShowLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { error: chatError, messages, sendMessage, status } = useTravelRecommend()
  const hasValidParams = Boolean(city && budget > 0 && days > 0)

  /* ---------- Undo/Redo 状态 ---------- */

  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  // 更新 undo/redo 状态
  useEffect(() => {
    if (!isEditing) return

    const temporal = getItineraryTemporal()
    const updateHistoryState = () => {
      setCanUndo(temporal.canUndo())
      setCanRedo(temporal.canRedo())
    }

    // 初始状态
    updateHistoryState()

    // 每 100ms 检查一次状态变化（简单实现）
    const timer = setInterval(updateHistoryState, 100)
    return () => clearInterval(timer)
  }, [isEditing])

  function findAttractionRef(spot?: string) {
    return attractionRefs.find((ref) => ref.name === spot)
  }

  function shareToCommunity() {
    router.push('/community/new')
  }

  /* ---------- 编辑模式操作 ---------- */

  function toggleEditMode() {
    const temporal = getItineraryTemporal()
    if (isEditing) {
      // 退出编辑模式，清空历史
      temporal.clear()
      setEditing(false)
    } else {
      // 进入编辑模式，保存初始快照
      temporal.snapshot()
      setEditing(true)
    }
  }

  function handleUndo() {
    const temporal = getItineraryTemporal()
    temporal.undo()
  }

  function handleRedo() {
    const temporal = getItineraryTemporal()
    temporal.redo()
  }

  function handleRemoveSpot(dayIndex: number, spotIndex: number) {
    removeSpotFromDay(dayIndex, spotIndex)
  }

  /** 移动景点在同一天内的位置（direction: -1 上移，1 下移） */
  function handleMoveSpot(dayIndex: number, spotIndex: number, direction: -1 | 1) {
    const targetIndex = spotIndex + direction
    const daySpots = itinerary[dayIndex]?.spots
    if (!daySpots || targetIndex < 0 || targetIndex >= daySpots.length) return
    moveSpot(dayIndex, spotIndex, dayIndex, targetIndex)
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
    <main
      aria-labelledby="detail-title"
      className="flex-1 overflow-x-hidden bg-background pb-[max(28px,env(safe-area-inset-bottom))]"
    >
      {/* Hero 区域 */}
      <div className="travel-route-line relative isolate min-h-[238px] overflow-hidden rounded-b-[clamp(26px,6vw,44px)] bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-[clamp(20px,5vw,44px)] pb-[70px] pt-[22px]">
        {/* 背景点阵 */}
        <div className="pointer-events-none absolute inset-0 -z-[1] bg-[radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px]" />
        {/* 装饰渐变 */}
        <div className="absolute right-[82%] top-[18%] h-[28%] w-[28%] rounded-full bg-travel-orange/26 blur-[100px]" />
        <div className="absolute bottom-[82%] left-[16%] h-[26%] w-[26%] rounded-full bg-amber-500/18 blur-[100px]" />

        <div className="relative z-[2] flex items-center justify-between">
          <button
            aria-label="返回上一页"
            className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 text-slate-100 transition-all hover:-translate-y-0.5 hover:bg-white/20"
            onClick={() => router.back()}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
          </button>

          {/* 编辑模式按钮 */}
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  aria-label="撤销"
                  className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 text-slate-100 transition-all hover:-translate-y-0.5 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  type="button"
                >
                  <Undo aria-hidden="true" className="h-4 w-4" />
                </button>
                <button
                  aria-label="重做"
                  className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/15 bg-white/10 text-slate-100 transition-all hover:-translate-y-0.5 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  disabled={!canRedo}
                  onClick={handleRedo}
                  type="button"
                >
                  <Redo aria-hidden="true" className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              aria-label={isEditing ? '退出编辑模式' : '编辑行程'}
              className={`flex h-11 items-center justify-center gap-2 rounded-[14px] border px-4 text-sm font-bold transition-all ${
                isEditing
                  ? 'border-accent bg-accent/20 text-accent'
                  : 'border-white/15 bg-white/10 text-slate-100 hover:-translate-y-0.5 hover:bg-white/20'
              }`}
              onClick={toggleEditMode}
              type="button"
            >
              <Edit3 aria-hidden="true" className="h-4 w-4" />
              {isEditing ? '完成编辑' : '编辑'}
            </button>
          </div>
        </div>

        <p className="mt-7 w-fit rounded-full border border-white/15 bg-white/8 px-3 py-1.5 font-sans text-[10px] font-extrabold uppercase tracking-[4px] text-slate-400">
          ITINERARY
        </p>

        <h1
          className="mb-2 mt-2.5 max-w-[min(620px,86vw)] font-display text-[clamp(34px,8vw,58px)] font-black leading-[1.08] text-slate-50"
          id="detail-title"
        >
          {city || '旅行规划'}
        </h1>

        {hasValidParams ? (
          <p className="w-fit rounded-full border border-white/12 bg-transparent px-3.5 py-2 text-[13px] font-bold text-white/60">
            {days} 天行程 · 预算 ¥{budget}
          </p>
        ) : null}
      </div>

      {/* 内容区域 */}
      <div className="mx-auto w-full max-w-[960px] px-[clamp(14px,4vw,28px)]">
        {showLoading ? (
          <div
            aria-label="AI 正在规划行程"
            aria-live="polite"
            className="flex justify-center py-7"
            role="status"
          >
            <div className="w-full max-w-[min(100%,520px)] overflow-hidden rounded-3xl border border-[var(--travel-frosted-border)] bg-travel-surface shadow-[var(--shadow-paper)]">
              <div className="flex items-center justify-between px-5 pb-2 pt-[18px]">
                <span className="text-[11px] font-extrabold tracking-[2px] text-travel-ink">
                  AI 规划中
                </span>
                <button
                  aria-label="关闭行程规划并返回"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-900/8 bg-white/72 text-sm text-stone-900/72 transition-all hover:rotate-[8deg] hover:scale-105 hover:bg-accent/20 hover:text-[#d63350]"
                  onClick={() => router.back()}
                  type="button"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <div className="px-1 pb-3">
                <AgentSteps currentStep={currentAgentStep} steps={agentSteps} />
              </div>
              <div className="relative mx-auto flex h-[46px] w-[46px] items-center justify-center">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 animate-spin rounded-full border-2 border-dotted border-stone-900/22 border-t-accent"
                />
                <Compass aria-hidden="true" className="text-lg text-travel-ink" />
              </div>
              <p className="py-3 pb-[22px] text-center font-serif text-[13px] text-stone-900/70">
                正在为你规划行程...
              </p>
            </div>
          </div>
        ) : null}

        {!showLoading && errorMessage ? (
          <div
            className="mx-auto -mt-9 flex w-full max-w-[560px] flex-col items-center gap-4 rounded-[26px] border border-[var(--travel-frosted-border)] bg-travel-surface p-[52px_22px] shadow-[var(--shadow-paper)]"
            role="alert"
          >
            <div className="flex h-[82px] w-[82px] items-center justify-center rounded-3xl bg-[#d4a76a]/15 text-[40px] text-travel-ink shadow-[0_16px_34px_rgba(var(--travel-ocean-rgb),0.1)]">
              <MapPin aria-hidden="true" />
            </div>
            <p className="text-center font-serif text-sm leading-relaxed text-stone-900/74">
              {errorMessage}
            </p>
            <button
              className="min-h-11 rounded-[14px] border-none bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(var(--travel-primary-rgb),0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(var(--travel-primary-rgb),0.34)]"
              onClick={() => router.push('/')}
              type="button"
            >
              返回首页重新规划
            </button>
          </div>
        ) : null}

        {!showLoading && !errorMessage && itinerary.length === 0 ? (
          messages.length > 0 ? (
            <div className="mx-auto -mt-9 w-full max-w-[560px] overflow-hidden rounded-[26px] border border-[var(--travel-frosted-border)] bg-travel-surface shadow-[var(--shadow-paper)]">
              <div className="flex items-center justify-between px-5 pb-2 pt-[18px]">
                <span className="text-[11px] font-extrabold tracking-[2px] text-travel-ink">
                  AI 生成的行程规划
                </span>
                {status !== 'ready' && (
                  <div
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin rounded-full border-2 border-dotted border-stone-900/22 border-t-accent"
                  />
                )}
              </div>
              <div className="px-5 pb-5">
                {messages.map((message) => (
                  <div className="mb-4 last:mb-0" key={message.id}>
                    {message.parts.map((part, index) => {
                      if (part.type === 'text') {
                        return (
                          <div
                            className="whitespace-pre-wrap break-words text-sm leading-[1.8] text-stone-900/85"
                            key={index}
                          >
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
                <div className="border-t border-red-500/10 bg-red-500/5 p-4 px-5" role="alert">
                  <p className="text-center text-[13px] text-red-500">
                    生成失败：
                    {chatError.message}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="mx-auto -mt-9 flex w-full max-w-[560px] flex-col items-center gap-4 rounded-[26px] border border-[var(--travel-frosted-border)] bg-travel-surface p-[52px_22px] shadow-[var(--shadow-paper)]"
              role="status"
            >
              <div className="flex h-[82px] w-[82px] items-center justify-center rounded-3xl bg-[#d4a76a]/15 text-[40px] text-travel-ink shadow-[0_16px_34px_rgba(var(--travel-ocean-rgb),0.1)]">
                <MapPin aria-hidden="true" />
              </div>
              <p className="text-center font-serif text-sm leading-relaxed text-stone-900/74">
                暂无行程数据
              </p>
              <button
                className="min-h-11 rounded-[14px] border-none bg-primary px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(var(--travel-primary-rgb),0.28)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(var(--travel-primary-rgb),0.34)]"
                onClick={() => router.push('/chat')}
                type="button"
              >
                咨询 AI 生成行程
              </button>
            </div>
          )
        ) : null}

        {!showLoading && !errorMessage && itinerary.length > 0 ? (
          <>
            {/* 摘要卡片 */}
            <div
              aria-label="行程摘要"
              className="travel-ticket-edge relative z-10 -mt-10 flex items-center overflow-hidden rounded-[22px] border border-[var(--travel-frosted-border)] bg-[var(--travel-surface-strong)] p-[18px_20px] shadow-[var(--shadow-paper)]"
            >
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[2px] text-stone-900/62">
                  目的地
                </span>
                <span className="max-w-full overflow-wrap-anywhere text-center font-serif text-base font-extrabold text-travel-ink">
                  {city}
                </span>
              </div>
              <div className="h-9 w-px bg-stone-900/12" />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[2px] text-stone-900/62">
                  天数
                </span>
                <span className="max-w-full overflow-wrap-anywhere text-center font-serif text-base font-extrabold text-travel-ink">
                  {days}天
                </span>
              </div>
              <div className="h-9 w-px bg-stone-900/12" />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-[2px] text-stone-900/62">
                  预算
                </span>
                <span className="max-w-full overflow-wrap-anywhere text-center font-serif text-base font-extrabold tabular-nums text-[#d63350]">
                  ¥{budget}
                </span>
              </div>
            </div>

            {/* 天气 */}
            {weather ? (
              <section aria-labelledby="detail-weather-title" className="pt-[22px]">
                <h2 className="flex items-center gap-2.5 pb-3 pl-1 font-serif text-base font-extrabold text-travel-ink">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_5px_rgba(var(--travel-accent-rgb),0.15)]"
                  />
                  实时天气
                </h2>
                <WeatherCard weather={weather} />
              </section>
            ) : null}

            {/* 住宿推荐 */}
            {accommodation.length > 0 || nightlife.length > 0 ? (
              <section aria-label="住宿和夜生活推荐" className="pt-[22px]">
                <AccommodationCard accommodation={accommodation} nightlife={nightlife} />
              </section>
            ) : null}

            {/* 每日行程 */}
            <section aria-labelledby="detail-itinerary-title" className="pt-[22px]">
              <h2
                className="flex items-center gap-2.5 pb-3 pl-1 font-serif text-base font-extrabold text-travel-ink"
                id="detail-itinerary-title"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_5px_rgba(var(--travel-accent-rgb),0.15)]"
                />
                每日行程
                {isEditing && (
                  <span className="ml-2 text-xs font-normal text-accent">
                    （编辑模式：可移动/删除景点，支持撤销）
                  </span>
                )}
              </h2>
              <div className="overflow-hidden rounded-3xl border border-[var(--travel-frosted-border)] bg-travel-surface shadow-[var(--shadow-paper)]">
                {itinerary.map((item, dayIndex) => {
                  const dayKey = String(item.day)
                  const panelId = `detail-day-panel-${dayKey}`
                  const isOpen = activeKeys.includes(dayKey)
                  return (
                    <div className="border-b border-stone-900/8 last:border-b-0" key={item.day}>
                      <button
                        aria-controls={panelId}
                        aria-expanded={isOpen}
                        className="flex min-h-[56px] w-full items-center justify-between gap-4 bg-transparent p-[16px_20px] text-left text-[15px] font-extrabold text-travel-ink transition-colors hover:bg-stone-900/[0.03]"
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
                          className={`inline-flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-stone-900/8 text-[10px] text-travel-ink transition-all ${
                            isOpen ? 'rotate-180 bg-accent/22' : ''
                          }`}
                        >
                          ▼
                        </span>
                      </button>
                      {isOpen ? (
                        <div className="bg-stone-900/[0.015] p-[6px_14px_16px]" id={panelId}>
                          {/* 景点列表：优先使用 spots 数组（编辑模式操作的目标），否则回退到 morning/afternoon/evening */}
                          {item.spots && item.spots.length > 0 ? (
                            item.spots.map((spot, spotIndex) => {
                              // 将 spots 数组索引映射到时段标签（循环使用上午/下午/晚上）
                              const periodLabels = ['上午', '下午', '晚上'] as const
                              const periodLabel = periodLabels[spotIndex % periodLabels.length]
                              return (
                                <div className="group relative" key={`${spot.name}-${spotIndex}`}>
                                  <SpotItem
                                    attractionRef={findAttractionRef(spot.name)}
                                    data={{
                                      description: spot.description,
                                      duration: spot.duration,
                                      spot: spot.name,
                                    }}
                                    period={periodLabel}
                                  />
                                  {isEditing && (
                                    <div className="absolute right-2 top-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                      <button
                                        aria-label={`上移${spot.name}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900/10 text-travel-ink transition-colors hover:bg-stone-900/20 disabled:cursor-not-allowed disabled:opacity-30"
                                        disabled={spotIndex === 0}
                                        onClick={() => handleMoveSpot(dayIndex, spotIndex, -1)}
                                        type="button"
                                      >
                                        <ArrowUp aria-hidden="true" className="h-4 w-4" />
                                      </button>
                                      <button
                                        aria-label={`下移${spot.name}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-900/10 text-travel-ink transition-colors hover:bg-stone-900/20 disabled:cursor-not-allowed disabled:opacity-30"
                                        disabled={spotIndex === item.spots.length - 1}
                                        onClick={() => handleMoveSpot(dayIndex, spotIndex, 1)}
                                        type="button"
                                      >
                                        <ArrowDown aria-hidden="true" className="h-4 w-4" />
                                      </button>
                                      <button
                                        aria-label={`删除${spot.name}`}
                                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white transition-colors hover:bg-red-600"
                                        onClick={() => handleRemoveSpot(dayIndex, spotIndex)}
                                        type="button"
                                      >
                                        <Trash2 aria-hidden="true" className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <>
                              {item.morning && (
                                <div className="relative group">
                                  <SpotItem
                                    attractionRef={findAttractionRef(item.morning.spot)}
                                    data={item.morning}
                                    period="上午"
                                  />
                                  {isEditing && (
                                    <button
                                      aria-label="删除上午景点"
                                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                                      onClick={() => handleRemoveSpot(dayIndex, 0)}
                                      type="button"
                                    >
                                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {item.afternoon && (
                                <div className="relative group">
                                  <SpotItem
                                    attractionRef={findAttractionRef(item.afternoon.spot)}
                                    data={item.afternoon}
                                    period="下午"
                                  />
                                  {isEditing && (
                                    <button
                                      aria-label="删除下午景点"
                                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                                      onClick={() => handleRemoveSpot(dayIndex, 1)}
                                      type="button"
                                    >
                                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                              {item.evening && (
                                <div className="relative group">
                                  <SpotItem
                                    attractionRef={findAttractionRef(item.evening.spot)}
                                    data={item.evening}
                                    period="晚上"
                                  />
                                  {isEditing && (
                                    <button
                                      aria-label="删除晚上景点"
                                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
                                      onClick={() => handleRemoveSpot(dayIndex, 2)}
                                      type="button"
                                    >
                                      <Trash2 aria-hidden="true" className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </>
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
              <section aria-labelledby="detail-tips-title" className="pt-[22px]">
                <h2
                  className="flex items-center gap-2.5 pb-3 pl-1 font-serif text-base font-extrabold text-travel-ink"
                  id="detail-tips-title"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_5px_rgba(var(--travel-accent-rgb),0.15)]"
                  />
                  温馨提示
                </h2>
                <div className="rounded-3xl border border-[var(--travel-frosted-border)] bg-travel-surface p-4 shadow-[var(--shadow-paper)]">
                  {tips.map((tip) => (
                    <div
                      className="flex items-start gap-3 py-2 text-[13px] leading-relaxed text-stone-900/72"
                      key={tip}
                    >
                      <span
                        aria-hidden="true"
                        className="mt-2 h-[7px] w-[7px] flex-shrink-0 rounded-full bg-travel-sand shadow-[0_0_0_5px_rgba(var(--travel-sand-rgb),0.16)]"
                      />
                      {tip}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* 分享与咨询操作 */}
            <div className="grid gap-3 pt-6">
              <button
                aria-label="分享到社区"
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-4xl border-none bg-primary text-[15px] font-black text-white shadow-[0_4px_16px_rgba(255,107,53,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.35)]"
                onClick={shareToCommunity}
                type="button"
              >
                <Share2 aria-hidden="true" />
                分享到社区
              </button>
              <button
                aria-label="咨询 AI 优化当前行程"
                className="inline-flex min-h-[50px] w-full items-center justify-center gap-2 rounded-4xl border-none bg-primary text-[15px] font-black text-white shadow-[0_4px_16px_rgba(255,107,53,0.25)] transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(255,107,53,0.35)]"
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
