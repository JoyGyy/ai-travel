'use client'

/**
 * 行程详情页面
 * 展示 AI 生成的旅行行程，包含天气、住宿、每日景点、预算明细等模块。
 * 优先从本地缓存读取，缓存未命中时通过 SSE 流式调用推荐接口生成行程。
 * 支持行程编辑模式和 Undo/Redo。
 */
import { Share2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useTravelRecommend } from '@/hooks/useTravelRecommend'
import { getItineraryTemporal, useItineraryStore } from '@/stores/itinerary'
import { loadItineraryCache } from '@/utils/storage'

import { DaySection } from './DaySection'
import { DetailHero } from './DetailHero'
import { EmptyState, ErrorState, LoadingState } from './DetailStates'
import { SectionTitle } from './SectionTitle'

// 行程卡片和工具步骤组件
const TravelItineraryCard = dynamic(
  () =>
    import('@/components/TravelItineraryCard').then(mod => ({
      default: mod.TravelItineraryCard,
    })),
  {
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
  },
)
const ToolSteps = dynamic(
  () => import('@/components/ToolSteps').then(mod => ({ default: mod.ToolSteps })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted" />,
  },
)

// 动态导入重型组件，减少初始包大小
const AccommodationCard = dynamic(
  () =>
    import('@/components/AccommodationCard').then(mod => ({ default: mod.AccommodationCard })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-xl bg-muted" />,
  },
)
const BudgetTable = dynamic(
  () => import('@/components/BudgetTable').then(mod => ({ default: mod.BudgetTable })),
  {
    loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" />,
  },
)
const WeatherCard = dynamic(
  () => import('@/components/WeatherCard').then(mod => ({ default: mod.WeatherCard })),
  {
    loading: () => <div className="h-40 animate-pulse rounded-xl bg-muted" />,
  },
)

/** 检查文本是否包含可解析的行程结构 */
function hasItineraryStructure(text: string): boolean {
  // 检查是否包含 Day 标记或时间段标记
  return /Day\s*\d|🌅|🌄|🌇|上午|中午|下午|傍晚|晚上/i.test(text)
}

/** 行程内容渲染：优先卡片展示，解析失败时降级为纯文本 */
function ItineraryContent({ text }: { text: string }) {
  const canParse = hasItineraryStructure(text)

  if (canParse) {
    return <TravelItineraryCard content={text} />
  }

  return (
    <div className="whitespace-pre-wrap break-words text-sm leading-[1.8] text-stone-900/85">
      {text}
    </div>
  )
}

export default function Detail() {
  /* ---------- 路由参数解析 ---------- */

  const router = useRouter()
  const searchParams = useSearchParams()

  const city = searchParams?.get('city') || ''
  const budget = Number(searchParams?.get('budget')) || 0
  const days = Number(searchParams?.get('days')) || 1

  const itinerary = useItineraryStore(s => s.itinerary)
  const budgetBreakdown = useItineraryStore(s => s.budgetBreakdown)
  const tips = useItineraryStore(s => s.tips)
  const weather = useItineraryStore(s => s.weather)
  const accommodation = useItineraryStore(s => s.accommodation)
  const nightlife = useItineraryStore(s => s.nightlife)
  const attractionRefs = useItineraryStore(s => s.attractionRefs)
  const agentSteps = useItineraryStore(s => s.agentSteps)
  const currentAgentStep = useItineraryStore(s => s.currentAgentStep)
  const isEditing = useItineraryStore(s => s.isEditing)
  const setItinerary = useItineraryStore(s => s.setItinerary)
  const setBudgetBreakdown = useItineraryStore(s => s.setBudgetBreakdown)
  const setTips = useItineraryStore(s => s.setTips)
  const setWeather = useItineraryStore(s => s.setWeather)
  const setAccommodation = useItineraryStore(s => s.setAccommodation)
  const setNightlife = useItineraryStore(s => s.setNightlife)
  const setAttractionRefs = useItineraryStore(s => s.setAttractionRefs)
  const _setCurrentAgentStep = useItineraryStore(s => s.setCurrentAgentStep)
  const setEditing = useItineraryStore(s => s.setEditing)
  const removeSpotFromDay = useItineraryStore(s => s.removeSpotFromDay)
  const moveSpot = useItineraryStore(s => s.moveSpot)

  /* ---------- 本地 UI 状态 ---------- */

  const [activeKeys, setActiveKeys] = useState<string[]>([])
  const [showLoading, setShowLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const { error: chatError, messages, sendMessage, status } = useTravelRecommend({
    city,
    budget,
    days,
  })
  const hasValidParams = Boolean(city && budget > 0 && days > 0)

  /* ---------- 从消息中提取工具调用（去重） ---------- */

  const toolCalls = useMemo(() => {
    const callMap = new Map<string, {
      args?: Record<string, unknown>
      id: string
      result?: unknown
      state: 'call' | 'result'
      toolName: string
    }>()

    for (const message of messages) {
      for (const part of message.parts) {
        // AI SDK v7: 工具调用的 type 为 `tool-${toolName}`
        if (part.type.startsWith('tool-')) {
          const toolPart = part as {
            input?: Record<string, unknown>
            output?: unknown
            state: string
            toolCallId: string
            toolName?: string
            type: string
          }
          const toolName = toolPart.toolName || part.type.replace('tool-', '')
          const toolCallId = toolPart.toolCallId

          // 按 toolCallId 去重，保留最新的状态
          const existing = callMap.get(toolCallId)
          if (!existing || toolPart.state === 'output-available') {
            callMap.set(toolCallId, {
              args: toolPart.input as Record<string, unknown>,
              id: toolCallId,
              result: toolPart.output,
              state: toolPart.state === 'output-available' ? 'result' : 'call',
              toolName,
            })
          }
        }
      }
    }

    // 按插入顺序返回（保持调用顺序）
    return Array.from(callMap.values())
  }, [messages])

  /** AI 回复中的纯文本内容 */
  const assistantText = useMemo(() => {
    return messages
      .filter(m => m.role === 'assistant')
      .flatMap(m =>
        m.parts
          .filter((p): p is { text: string, type: 'text' } => p.type === 'text')
          .map(p => p.text),
      )
      .join('')
  }, [messages])

  /* ---------- Undo/Redo 状态 ---------- */

  // temporal 历史记录不参与 Zustand 的 React 订阅；行程编辑、撤销和重做
  // 都会同时更新行程状态，从当前渲染直接派生按钮状态即可，避免轮询。
  const temporal = getItineraryTemporal()
  const canUndo = isEditing && temporal.canUndo()
  const canRedo = isEditing && temporal.canRedo()

  /* ---------- 编辑模式操作 ---------- */

  function toggleEditMode() {
    if (isEditing) {
      temporal.clear()
      setEditing(false)
    }
    else {
      temporal.snapshot()
      setEditing(true)
    }
  }

  function handleUndo() {
    getItineraryTemporal().undo()
  }

  function handleRedo() {
    getItineraryTemporal().redo()
  }

  function handleRemoveSpot(dayIndex: number, spotIndex: number) {
    removeSpotFromDay(dayIndex, spotIndex)
  }

  function handleMoveSpot(dayIndex: number, spotIndex: number, direction: -1 | 1) {
    const targetIndex = spotIndex + direction
    const daySpots = itinerary[dayIndex]?.spots
    if (!daySpots || targetIndex < 0 || targetIndex >= daySpots.length)
      return
    moveSpot(dayIndex, spotIndex, dayIndex, targetIndex)
  }

  /* ---------- 数据加载：优先缓存 → SSE 流式生成 ---------- */

  /** 防止同一组参数重复发送消息；参数变化时允许重新生成 */
  const sentRequestKey = useRef<string | null>(null)

  useEffect(() => {
    if (!hasValidParams) {
      sentRequestKey.current = null
      setShowLoading(false)
      setErrorMessage('缺少目的地或预算信息，请返回首页重新规划。')
      return
    }

    setShowLoading(true)
    setErrorMessage('')

    const requestKey = `${city}:${budget}:${days}`

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
      setActiveKeys(cachedItinerary[0]?.day ? [String(cachedItinerary[0].day)] : [])
      setShowLoading(false)
      sentRequestKey.current = requestKey
      return
    }

    // 防止重复发送消息
    if (sentRequestKey.current === requestKey) {
      return
    }
    sentRequestKey.current = requestKey

    useItineraryStore.setState({ agentSteps: [], currentAgentStep: 0 })
    sendMessage({ text: `请为我规划 ${city} ${days} 天旅行，预算 ${budget} 元` })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, budget, days, hasValidParams])

  /* ---------- 监听消息状态，更新 loading ---------- */

  useEffect(() => {
    // 当有消息且状态为 ready（完成）时，隐藏 loading
    if (messages.length > 0 && status === 'ready') {
      setShowLoading(false)
    }
    // 当有消息且正在流式传输时，也隐藏 loading（显示消息卡片）
    if (messages.length > 0 && (status === 'streaming' || status === 'submitted')) {
      setShowLoading(false)
    }
  }, [messages, status])

  /* ========== 渲染 ========== */

  return (
    <main
      className="flex-1 overflow-x-hidden bg-background pb-[max(28px,env(safe-area-inset-bottom))]"
    >
      <DetailHero
        budget={budget}
        canRedo={canRedo}
        canUndo={canUndo}
        city={city}
        days={days}
        hasValidParams={hasValidParams}
        isEditing={isEditing}
        onRedo={handleRedo}
        onToggleEdit={toggleEditMode}
        onUndo={handleUndo}
      />

      {/* 内容区域 */}
      <div className="mx-auto w-full max-w-[960px] px-[clamp(14px,4vw,28px)]">
        {showLoading && (
          <LoadingState
            agentSteps={agentSteps}
            currentAgentStep={currentAgentStep}
            onClose={() => router.back()}
            toolCalls={toolCalls}
          />
        )}

        {!showLoading && errorMessage && (
          <ErrorState message={errorMessage} onGoHome={() => router.push('/')} />
        )}

        {!showLoading && !errorMessage && itinerary.length === 0 && (
          messages.length > 0
            ? (
                <div className="mx-auto -mt-9 w-full max-w-[640px] space-y-4">
                  {/* 工具调用步骤展示 */}
                  {toolCalls.length > 0 && (
                    <ToolSteps
                      isLoading={status !== 'ready'}
                      toolCalls={toolCalls}
                    />
                  )}

                  {/* AI 行程规划结果 */}
                  <div className="overflow-hidden rounded-lg border border-travel-ink/8 bg-travel-surface shadow-sm">
                    <div className="flex items-center justify-between px-5 pb-2 pt-[18px]">
                      <span className="text-2.75 font-extrabold tracking-[2px] text-travel-ink">
                        AI 生成的行程规划
                      </span>
                      {status !== 'ready' && (
                        <div
                          className="h-5 w-5 animate-spin rounded-full border-2 border-dotted border-stone-900/22 border-t-accent"
                        />
                      )}
                    </div>
                    <div className="px-5 pb-5">
                      {assistantText
                        ? (
                            <ItineraryContent text={assistantText} />
                          )
                        : messages.map(message => (
                            <div className="mb-4 last:mb-0" key={message.id}>
                              {message.parts.map((part, index) => {
                                if (part.type === 'text') {
                                  return (
                                    <div
                                      className="whitespace-pre-wrap break-words text-sm leading-[1.8] text-stone-900/85"
                                      // eslint-disable-next-line react/no-array-index-key
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
                      <div className="border-t border-red-500/10 bg-red-500/5 p-4 px-5">
                        <p className="text-center text-3.25 text-red-500">
                          生成失败：
                          {chatError.message}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            : <EmptyState onGoChat={() => router.push('/chat')} />
        )}

        {!showLoading && !errorMessage && itinerary.length > 0 && (
          <>
            {/* 摘要卡片 */}
            <div
              className="travel-ticket-edge relative z-10 -mt-10 flex items-center overflow-hidden rounded-lg border border-travel-ink/8 bg-travel-surface-strong p-[18px_20px] shadow-sm"
            >
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-2.5 font-extrabold uppercase tracking-[2px] text-stone-900/62">
                  目的地
                </span>
                <span className="max-w-full overflow-wrap-anywhere text-center font-serif text-base font-extrabold text-travel-ink">
                  {city}
                </span>
              </div>
              <div className="h-9 w-px bg-stone-900/12" />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-2.5 font-extrabold uppercase tracking-[2px] text-stone-900/62">
                  天数
                </span>
                <span className="max-w-full overflow-wrap-anywhere text-center font-serif text-base font-extrabold text-travel-ink">
                  {days}
                  天
                </span>
              </div>
              <div className="h-9 w-px bg-stone-900/12" />
              <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                <span className="text-2.5 font-extrabold uppercase tracking-[2px] text-stone-900/62">
                  预算
                </span>
                <span className="max-w-full overflow-wrap-anywhere text-center font-serif text-base font-bold tabular-nums text-accent">
                  ¥
                  {budget}
                </span>
              </div>
            </div>

            {/* 天气 */}
            {weather && (
              <section className="pt-[22px]">
                <SectionTitle id="detail-weather-title">实时天气</SectionTitle>
                <WeatherCard weather={weather} />
              </section>
            )}

            {/* 住宿推荐 */}
            {(accommodation.length > 0 || nightlife.length > 0) && (
              <section className="pt-[22px]">
                <AccommodationCard accommodation={accommodation} nightlife={nightlife} />
              </section>
            )}

            {/* 每日行程 */}
            <section className="pt-[22px]">
              <SectionTitle id="detail-itinerary-title">
                每日行程
                {isEditing && (
                  <span className="ml-2 text-xs font-normal text-accent">
                    （编辑模式：可移动/删除景点，支持撤销）
                  </span>
                )}
              </SectionTitle>
              <div className="overflow-hidden rounded-lg border border-travel-ink/8 bg-travel-surface shadow-sm">
                {itinerary.map((item, dayIndex) => (
                  <DaySection
                    attractionRefs={attractionRefs}
                    dayIndex={dayIndex}
                    isEditing={isEditing}
                    isOpen={activeKeys.includes(String(item.day))}
                    item={item}
                    key={item.day}
                    onMoveSpot={handleMoveSpot}
                    onRemoveSpot={handleRemoveSpot}
                    onToggle={() =>
                      setActiveKeys(prev =>
                        activeKeys.includes(String(item.day))
                          ? prev.filter(k => k !== String(item.day))
                          : [...prev, String(item.day)],
                      )}
                  />
                ))}
              </div>
            </section>

            {/* 预算明细 */}
            {budgetBreakdown && <BudgetTable data={budgetBreakdown} />}

            {/* 温馨提示 */}
            {tips.length > 0 && (
              <section className="pt-[22px]">
                <SectionTitle id="detail-tips-title">温馨提示</SectionTitle>
                <div className="rounded-lg border border-travel-ink/8 bg-travel-surface p-4 shadow-sm">
                  {tips.map(tip => (
                    <div
                      className="flex items-start gap-3 py-2 text-3.25 leading-relaxed text-stone-900/72"
                      key={tip}
                    >
                      <span
                        className="mt-2 h-[7px] w-[7px] flex-shrink-0 rounded-full bg-travel-sand shadow-[0_0_0_5px_rgba(212,167,106,0.16)]"
                      />
                      {tip}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 分享与咨询操作 */}
            <div className="grid gap-3 pt-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <button
                className="inline-flex min-h-12.5 w-full items-center justify-center gap-2 rounded-lg border border-primary/25 bg-white text-3.75 font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                onClick={() => router.push('/community/new')}
                type="button"
              >
                <Share2 />
                分享到社区
              </button>
              <button
                className="inline-flex min-h-12.5 w-full items-center justify-center gap-2 rounded-lg border border-primary bg-primary text-3.75 font-semibold text-white shadow-[0_4px_16px_rgba(34,111,120,0.24)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_8px_24px_rgba(34,111,120,0.3)]"
                onClick={() => router.push('/chat')}
                type="button"
              >
                咨询 AI 优化行程
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
