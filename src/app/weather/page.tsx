'use client'

/**
 * 天气查询页面
 *
 * 提供城市搜索（带下拉联想）和热门城市快捷入口，
 * 调用 useWeather hook 获取并展示实时天气数据。
 */
import type { ChangeEvent, KeyboardEvent } from 'react'

import { useMemo, useState } from 'react'

import { HomeWeather } from '@/components/HomeWeather'
import { allCities, hotCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'

export default function Weather() {
  const [city, setCity] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const { error, fetchWeather, loading, weather } = useWeather()

  // ---- 城市搜索过滤 ----
  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword) return allCities
    return allCities.filter((c) => c.includes(keyword))
  }, [city])

  const activeCityId =
    showDropdown && filteredCities[activeCityIndex]
      ? `weather-city-option-${activeCityIndex}`
      : undefined

  // ---- 城市选择 ----
  function selectCity(name: string) {
    setCity(name)
    setActiveCityIndex(0)
    setShowDropdown(false)
    fetchWeather(name)
  }

  // ---- 输入处理 ----
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setCity(event.target.value)
    setActiveCityIndex(0)
    setShowDropdown(true)
  }

  // ---- 下拉列表键盘导航 ----
  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      setShowDropdown(true)
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (filteredCities.length)
        setActiveCityIndex((index) => Math.min(index + 1, filteredCities.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (filteredCities.length) setActiveCityIndex((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (showDropdown && filteredCities[activeCityIndex])
        selectCity(filteredCities[activeCityIndex])
      else if (city.trim()) fetchWeather(city.trim())
    } else if (event.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  // ---- 错误重试 ----
  function retryWeather() {
    if (city.trim()) fetchWeather(city.trim())
  }

  return (
    <main
      aria-labelledby="weather-title"
      className="flex-1 overflow-x-hidden overflow-y-auto bg-background"
      onClick={() => showDropdown && setShowDropdown(false)}
    >
      {/* Hero 区域 */}
      <div className="relative isolate min-h-[230px] overflow-hidden bg-[url('data:image/svg+xml,...')] bg-repeat p-[clamp(40px,8vw,80px)_clamp(20px,5vw,72px)_70px]">
        {/* 装饰圆圈 */}
        <div className="absolute -right-7 -top-[34px] h-[164px] w-[164px] animate-[morphBg_8s_ease-in-out_infinite] rounded-full border border-stone-900/6 bg-transparent opacity-60" />

        <p className="relative mb-2.5 text-[11px] font-bold tracking-[0.03em] text-travel-muted animate-[fadeIn_var(--motion-choreography)_var(--ease-emphasized)_0.1s_both]">
          WEATHER
        </p>
        <h1 className="relative font-display text-[clamp(28px,5vw,44px)] font-black leading-tight tracking-tight text-travel-ink animate-[slideUp_var(--motion-choreography)_var(--ease-emphasized)_both]" id="weather-title">
          天气查询
        </h1>
        <p className="relative mt-2.5 max-w-[460px] text-[clamp(14px,2vw,16px)] font-semibold leading-relaxed text-travel-muted animate-[slideUp_var(--motion-choreography)_var(--ease-emphasized)_0.1s_both]">
          查看目的地实时天气，合理安排行程
        </p>
      </div>

      {/* 内容区域 */}
      <div className="relative z-[2] mx-auto -mt-[42px] max-w-[1200px] px-6 pb-[max(36px,env(safe-area-inset-bottom))]">
        {/* 搜索框 */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2.5 rounded-xl border border-travel-border bg-white/90 p-3">
            <svg
              aria-hidden="true"
              className="h-[18px] w-[18px] text-travel-muted"
              fill="none"
              height="18"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="18"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <label className="text-[13px] font-medium text-travel-ink" htmlFor="weather-city-input">
              城市名称
            </label>
            <input
              aria-activedescendant={activeCityId}
              aria-autocomplete="list"
              aria-controls="weather-city-listbox"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
              className="flex-1 bg-transparent text-sm text-travel-ink outline-none placeholder:text-travel-muted"
              id="weather-city-input"
              name="weather-city"
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleInputKeyDown}
              placeholder="输入城市名称查询天气…"
              role="combobox"
              type="text"
              value={city}
            />
          </div>

          {/* 下拉列表 */}
          {showDropdown && (
            <div
              className="absolute left-0 right-0 z-10 mt-1 max-h-[300px] overflow-y-auto rounded-xl border border-travel-border bg-white shadow-lg"
              id="weather-city-listbox"
              role="listbox"
            >
              {filteredCities.map((name, index) => (
                <button
                  aria-selected={city === name}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                    city === name || activeCityIndex === index
                      ? 'bg-primary/10 text-primary'
                      : 'text-travel-ink hover:bg-travel-surface'
                  }`}
                  id={`weather-city-option-${index}`}
                  key={name}
                  onClick={() => selectCity(name)}
                  role="option"
                  type="button"
                >
                  {name}
                </button>
              ))}
              {!filteredCities.length && (
                <div className="px-4 py-3 text-center text-sm text-travel-muted">
                  未找到匹配城市
                </div>
              )}
            </div>
          )}
        </div>

        {/* 天气结果展示 */}
        {(loading || weather) && (
          <div className="mt-6">
            <HomeWeather loading={loading} weather={weather} />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
            <span className="text-sm text-red-600">{error}</span>
            {city.trim() && (
              <button
                className="rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                onClick={retryWeather}
                type="button"
              >
                重试
              </button>
            )}
          </div>
        )}

        {/* 热门城市快捷入口 */}
        <div className="mt-12">
          <div className="mb-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-travel-border" />
            <h2 className="text-lg font-semibold text-travel-ink">热门城市</h2>
            <div className="h-px flex-1 bg-travel-border" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {hotCities.map((name) => (
              <button
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                  city === name
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-travel-surface text-travel-ink hover:bg-travel-surface/80'
                }`}
                key={name}
                onClick={() => selectCity(name)}
                type="button"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
