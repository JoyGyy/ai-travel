/**
 * 首页组件
 * 应用的主入口页面，提供行程规划表单、热门城市推荐和实时天气
 */
import { Toast } from 'antd-mobile'
import { CalendarOutline, EnvironmentOutline, PayCircleOutline, TagOutline } from 'antd-mobile-icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allCities, hotCities } from '@/constants/cities'
import { HomeWeather } from '@/components/HomeWeather'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'

export default function Home() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState(1)
  const [showDropdown, setShowDropdown] = useState(false)
  const { weather, loading: weatherLoading, fetchWeather } = useWeather()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword) return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  function selectCity(name: string) {
    setCity(name)
    setShowDropdown(false)
    fetchWeather(name)
  }

  // 输入城市时防抖查询天气
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = city.trim()
    if (!trimmed || trimmed.length < 2) return
    debounceRef.current = setTimeout(() => {
      // 只在城市名在已知列表中时才查询
      if (allCities.includes(trimmed)) fetchWeather(trimmed)
    }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [city, fetchWeather])

  function onStart() {
    if (!user) return navigate('/login')
    if (!city) return Toast.show('请选择目的地')
    if (!budget) return Toast.show('请输入预算')
    const budgetNum = Number(budget)
    if (Number.isNaN(budgetNum) || budgetNum <= 0) return Toast.show('请输入有效的预算金额')
    navigate(`/detail?city=${encodeURIComponent(city)}&budget=${budgetNum}&days=${days}`)
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      {/* Hero 区域 */}
      <div
        className="relative overflow-hidden px-6 pb-16 pt-14 md:pb-22 md:pt-18"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
      >
        {/* 装饰性元素 */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.08)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.05)', filter: 'blur(30px)' }} />

        <div className="relative z-10">
          <p className="mb-4 text-[11px] font-semibold tracking-[5px]" style={{ fontFamily: 'var(--font-sans)', color: 'var(--c-gold-light)', opacity: 0.8 }}>
            AI-POWERED TRAVEL
          </p>
          <h1 className="mb-4 text-[2.5rem] md:text-5xl font-bold leading-[1.15]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            智能旅游
            <br />
            <span style={{ color: 'rgba(253, 246, 236, 0.85)' }}>助手</span>
          </h1>
          <p className="text-[13px] font-light tracking-wide" style={{ color: 'rgba(253, 246, 236, 0.55)' }}>
            让 AI 为你规划一段完美旅程
          </p>
        </div>
      </div>

      {/* 表单区域 */}
      <div className="px-4 -mt-8 relative z-10 md:max-w-3xl md:mx-auto md:px-6" onClick={() => showDropdown && setShowDropdown(false)}>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-xl)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
        >
          {/* 表单标题 */}
          <div className="flex items-center gap-2.5 pt-5 px-5 pb-1" style={{ color: 'var(--c-ink)' }}>
            <span
              className="flex items-center justify-center w-8 h-8 rounded-xl"
              style={{ background: 'var(--c-sand)', color: 'var(--c-terracotta)', fontSize: '15px' }}
            >
              <TagOutline />
            </span>
            <span className="text-[15px] font-semibold" style={{ letterSpacing: '0.5px' }}>规划你的旅行</span>
          </div>

          {/* 城市输入 */}
          <div
            className="relative px-5 pt-4 pb-3 border-b transition-colors focus-within:border-[var(--c-terracotta)]"
            style={{ borderColor: 'rgba(240, 232, 221, 0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <label className="block text-[11px] mb-2 font-medium tracking-wide" style={{ color: 'var(--c-ink-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              目的地
            </label>
            <div className="flex items-center gap-2.5">
              <EnvironmentOutline style={{ color: 'var(--c-ink-light)', fontSize: 18, opacity: 0.6, flexShrink: 0 }} />
              <input
                type="text"
                placeholder="输入搜索城市"
                value={city}
                onChange={(e) => { setCity(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                className="w-full py-2 px-0 text-sm border-0 outline-none"
                style={{ background: 'transparent', color: 'var(--c-ink)' }}
              />
            </div>
            {showDropdown && (
              <div
                className="absolute left-0 right-0 z-10 max-h-60 overflow-y-auto border-t"
                style={{ background: 'var(--c-white)', borderColor: 'var(--c-paper-dark)', boxShadow: 'var(--shadow-lg)' }}
              >
                {filteredCities.map(name => (
                  <div
                    key={name}
                    onClick={() => selectCity(name)}
                    className="px-5 py-3 text-sm cursor-pointer transition-colors"
                    style={{
                      color: city === name ? 'var(--c-terracotta)' : 'var(--c-ink)',
                      fontWeight: city === name ? 600 : 400,
                      background: city === name ? 'var(--c-sand)' : 'transparent',
                    }}
                  >
                    {name}
                  </div>
                ))}
                {!filteredCities.length && (
                  <div className="px-5 py-6 text-center text-xs" style={{ color: 'var(--c-ink-light)' }}>未找到匹配城市</div>
                )}
              </div>
            )}
          </div>

          {/* 预算输入 */}
          <div className="px-5 pt-4 pb-3 border-b transition-colors focus-within:border-[var(--c-terracotta)]" style={{ borderColor: 'rgba(240, 232, 221, 0.6)' }}>
            <label className="block text-[11px] mb-2 font-medium tracking-wide" style={{ color: 'var(--c-ink-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              预算 (元)
            </label>
            <div className="flex items-center gap-2.5">
              <PayCircleOutline style={{ color: 'var(--c-ink-light)', fontSize: 18, opacity: 0.6, flexShrink: 0 }} />
              <input
                type="number"
                placeholder="输入预算金额"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full py-2 px-0 text-sm border-0 outline-none"
                style={{ background: 'transparent', color: 'var(--c-ink)' }}
              />
            </div>
          </div>

          {/* 天数选择 */}
          <div className="px-5 pt-4 pb-3 border-b transition-colors focus-within:border-[var(--c-terracotta)]" style={{ borderColor: 'rgba(240, 232, 221, 0.6)' }}>
            <label className="block text-[11px] mb-2 font-medium tracking-wide" style={{ color: 'var(--c-ink-light)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              天数
            </label>
            <div className="flex items-center gap-2.5">
              <CalendarOutline style={{ color: 'var(--c-ink-light)', fontSize: 18, opacity: 0.6, flexShrink: 0 }} />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDays(Math.max(1, days - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium border-none cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--c-paper)', color: 'var(--c-ink-light)' }}
                >
                  -
                </button>
                <span className="w-10 text-center text-base font-semibold tabular-nums" style={{ color: 'var(--c-ink)' }}>{days}</span>
                <button
                  onClick={() => setDays(Math.min(30, days + 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-medium border-none cursor-pointer transition-all active:scale-95"
                  style={{ background: 'var(--c-paper)', color: 'var(--c-ink-light)' }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="px-5 pb-5 pt-4">
            <button
              onClick={onStart}
              className="w-full h-12 rounded-xl text-[15px] font-semibold tracking-wider border-none cursor-pointer text-white transition-all duration-200 hover:brightness-105 active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.2)',
              }}
            >
              开始规划
            </button>
          </div>
        </div>
      </div>

      {/* 天气展示 */}
      {city.trim() && allCities.includes(city.trim()) && (weather || weatherLoading) && (
        <div className="px-4 pt-4 md:max-w-3xl md:mx-auto md:px-6">
          {weather
            ? <HomeWeather weather={weather} loading={weatherLoading} />
            : (
                <div
                  className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 border-dotted animate-spin"
                    style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)' }}
                  />
                  <span className="text-[13px]" style={{ color: 'var(--c-ink-light)' }}>正在查询天气...</span>
                </div>
              )}
        </div>
      )}

      {/* 热门城市 */}
      <div className="px-4 pt-8 pb-10 md:max-w-3xl md:mx-auto md:px-6 md:py-12">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--c-paper-dark), transparent)' }} />
          <h3 className="whitespace-nowrap text-[13px] font-semibold tracking-wider" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink-light)' }}>
            热门目的地
          </h3>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, var(--c-paper-dark), transparent)' }} />
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3">
          {hotCities.map(name => (
            <button
              key={name}
              onClick={() => selectCity(name)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.96]"
              style={{
                background: city === name ? 'var(--c-terracotta)' : 'var(--c-white)',
                color: city === name ? '#fff' : 'var(--c-ink-light)',
                borderColor: city === name ? 'var(--c-terracotta)' : 'rgba(240, 232, 221, 0.6)',
                boxShadow: city === name ? '0 2px 8px rgba(99, 102, 241, 0.2)' : 'var(--shadow-xs)',
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}
