/**
 * 分享落地页
 * 展示公开分享的行程，无需登录即可访问
 */
import type { ItineraryResult, ShareData } from '@/types'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AccommodationCard } from '@/components/AccommodationCard'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { WeatherCard } from '@/components/WeatherCard'

/** 页面状态 */
type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: ShareData }

export default function Share() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>(
    id ? { status: 'loading' } : { status: 'error', message: '无效的分享链接' },
  )
  const [activeKeys, setActiveKeys] = useState<string[]>([])

  useEffect(() => {
    if (!id) return

    const controller = new AbortController()

    async function fetchShare() {
      try {
        const res = await fetch(`/api/travel/share/${id}`, { signal: controller.signal })
        if (!res.ok) {
          if (res.status === 404) {
            setState({ status: 'error', message: '分享不存在或已过期' })
            return
          }
          throw new Error(`请求失败: ${res.status}`)
        }
        const json = await res.json()
        if (!json.success || !json.data) {
          setState({ status: 'error', message: json.message || '获取分享数据失败' })
          return
        }
        setState({ status: 'success', data: json.data })
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setState({ status: 'error', message: '网络错误，请稍后重试' })
      }
    }

    fetchShare()
    return () => controller.abort()
  }, [id])

  // 动态设置 document.title 和 OG meta 标签
  useEffect(() => {
    if (state.status !== 'success') return
    const { city, days, itinerary } = state.data
    const title = `${city} ${days}天旅行计划`

    document.title = `${title} - 旅行助手`

    // 设置 OG meta 标签
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('property', property)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    setMeta('og:title', title)
    setMeta('og:description', `AI 为你规划的${city}${days}天深度旅行计划，包含每日行程、预算明细和旅行提示。`)
    setMeta('og:type', 'article')
    setMeta('og:url', window.location.href)

    // 从 itinerary 中提取第一天的第一个景点作为摘要
    const firstSpot = itinerary.dailyItinerary?.[0]?.morning?.spot
    if (firstSpot) {
      setMeta('og:site_name', `旅行助手 - ${firstSpot}等你探索`)
    }

    return () => {
      document.title = '旅行助手'
    }
  }, [state])

  // 加载中状态
  if (state.status === 'loading') {
    return (
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
        <div
          className="relative px-6 pt-5 pb-10"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
          <p className="mt-2 mb-2 text-[10px] font-semibold tracking-[5px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)', opacity: 0.75 }}>SHARED ITINERARY</p>
          <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <div className="h-4 w-32 rounded mt-2 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
        <div className="flex flex-col items-center py-16 gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-dotted"
            style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)', animation: 'spin 1s linear infinite' }}
          />
          <p className="text-[13px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>
            正在加载行程...
          </p>
        </div>
      </div>
    )
  }

  // 错误状态
  if (state.status === 'error') {
    return (
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
        <div
          className="relative px-6 pt-5 pb-10"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
          <p className="mt-2 mb-2 text-[10px] font-semibold tracking-[5px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)', opacity: 0.75 }}>SHARED ITINERARY</p>
          <h1 className="mb-2 text-[28px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            分享行程
          </h1>
        </div>
        <div className="flex flex-col items-center py-20 gap-5 px-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'var(--c-sand)' }}>
            <span className="text-3xl">😕</span>
          </div>
          <p className="text-[15px] font-medium" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>
            {state.message}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl border-none cursor-pointer text-sm font-medium transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)', color: '#fff', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.2)' }}
          >
            去规划我的旅行
          </button>
        </div>
      </div>
    )
  }

  // 成功状态 — 渲染行程
  const { city, days, budget, itinerary, viewCount } = state.data
  const {
    dailyItinerary = [],
    budgetBreakdown,
    tips = [],
    weather,
    accommodation = [],
    nightlife = [],
  } = itinerary as ItineraryResult

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)', paddingBottom: '80px' }}>
      {/* Hero 区域 */}
      <div
        className="relative px-6 pt-5 pb-10 md:pt-8 md:pb-14"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
        <p className="mt-2 mb-2 text-[10px] font-semibold tracking-[5px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)', opacity: 0.75 }}>SHARED ITINERARY</p>
        <h1 className="mb-2 text-[28px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {city} 的 {days} 天旅行计划
        </h1>
        <p className="text-[12px] font-light" style={{ color: 'rgba(253, 246, 236, 0.5)' }}>
          由 AI 智能规划 &middot; 已有 {viewCount} 人查看过此行程
        </p>
      </div>

      <div className="md:max-w-4xl md:mx-auto">
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

        {/* 社交证明 */}
        <div className="flex items-center justify-center gap-2 pt-5 pb-1">
          <div className="flex -space-x-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px]"
                style={{ borderColor: 'var(--c-white)', background: 'var(--c-sand)', color: 'var(--c-terracotta)' }}
              >
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <span className="text-[12px]" style={{ color: 'var(--c-ink-light)' }}>
            已有 {viewCount} 人查看过此行程
          </span>
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
          {dailyItinerary.map(item => (
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

        {/* 预算明细 */}
        {budgetBreakdown && <BudgetTable data={budgetBreakdown} />}

        {/* 旅行提示 */}
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
      </div>

      {/* 底部固定 CTA 栏 */}
      <div
        className="fixed bottom-0 left-0 right-0 px-4 py-3 z-50 md:px-8"
        style={{
          background: 'rgba(255, 252, 248, 0.9)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderTop: '1px solid rgba(240, 232, 221, 0.5)',
        }}
      >
        <div className="md:max-w-4xl md:mx-auto">
          <button
            onClick={() => navigate('/')}
            className="w-full h-11 rounded-xl text-[14px] font-medium cursor-pointer transition-all active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
              color: '#fff',
              border: 'none',
              boxShadow: '0 2px 12px rgba(99, 102, 241, 0.25)',
            }}
          >
            我也要规划一次旅行 →
          </button>
        </div>
      </div>
    </div>
  )
}
