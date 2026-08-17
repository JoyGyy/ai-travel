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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <div className="relative isolate min-h-[280px] overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-[clamp(40px,8vw,80px)_clamp(20px,5vw,72px)_80px]">
        {/* 装饰元素 */}
        <div className="absolute -right-20 -top-20 h-[300px] w-[300px] animate-[morphBg_8s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full bg-gradient-to-br from-purple-200/20 to-pink-200/20 blur-3xl" />
        <div className="absolute right-[12%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-2 border-blue-200/40 bg-transparent" />

        <p className="relative mb-3 text-[11px] font-bold tracking-[0.16em] text-blue-500 animate-[fadeIn_var(--motion-choreography)_var(--ease-emphasized)_0.1s_both] uppercase">
          WEATHER
        </p>
        <h1
          className="relative font-display text-[clamp(32px,5vw,48px)] font-black leading-tight tracking-tight animate-[slideUp_var(--motion-choreography)_var(--ease-emphasized)_both]"
          id="weather-title"
        >
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            天气查询
          </span>
        </h1>
        <p className="relative mt-3 max-w-[460px] text-[clamp(14px,2vw,16px)] font-semibold leading-relaxed text-gray-600 animate-[slideUp_var(--motion-choreography)_var(--ease-emphasized)_0.1s_both]">
          查看目的地实时天气，合理安排行程
        </p>
      </div>

      {/* 内容区域 */}
      <div className="relative z-[2] mx-auto -mt-[52px] max-w-[1200px] px-6 pb-[max(36px,env(safe-area-inset-bottom))]">
        {/* 搜索框 */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl focus-within:border-blue-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-200">
            <svg
              aria-hidden="true"
              className="h-5 w-5 text-blue-500"
              fill="none"
              height="20"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              width="20"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" x2="16.65" y1="21" y2="16.65" />
            </svg>
            <Label className="text-sm font-semibold text-gray-700" htmlFor="weather-city-input">
              城市名称
            </Label>
            <Input
              aria-activedescendant={activeCityId}
              aria-autocomplete="list"
              aria-controls="weather-city-listbox"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
              className="flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 shadow-none focus-visible:ring-0"
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
              className="absolute left-0 right-0 z-10 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-sm"
              id="weather-city-listbox"
              role="listbox"
            >
              {filteredCities.map((name, index) => (
                <Button
                  aria-selected={city === name}
                  className={`w-full justify-start rounded-none px-4 py-3 text-left text-sm first:rounded-t-2xl last:rounded-b-2xl ${
                    city === name || activeCityIndex === index
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700'
                  }`}
                  id={`weather-city-option-${index}`}
                  key={name}
                  onClick={() => selectCity(name)}
                  role="option"
                  variant="ghost"
                >
                  {name}
                </Button>
              ))}
              {!filteredCities.length && (
                <div className="px-4 py-4 text-center text-sm text-gray-500">
                  未找到匹配城市
                </div>
              )}
            </div>
          )}
        </div>

        {/* 天气结果展示 */}
        {(loading || weather) && (
          <div className="mt-8 animate-fade-in-up">
            <HomeWeather loading={loading} weather={weather} />
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div
            className="mt-6 flex items-center justify-between rounded-2xl border border-red-200/60 bg-red-50/80 p-5 backdrop-blur-sm animate-fade-in-up"
            role="alert"
          >
            <span className="text-sm font-medium text-red-600">{error}</span>
            {city.trim() && (
              <Button
                className="bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md"
                onClick={retryWeather}
                variant="outline"
              >
                重试
              </Button>
            )}
          </div>
        )}

        {/* 热门城市快捷入口 */}
        <div className="mt-16 animate-fade-in-up">
          <div className="mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-500 text-white text-sm">
                🔥
              </span>
              热门城市
            </h2>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {hotCities.map((name, index) => (
              <Button
                className={`group relative rounded-2xl px-6 py-3 animate-fade-in-up ${
                  city === name
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                }`}
                key={name}
                onClick={() => selectCity(name)}
                style={{ animationDelay: `${index * 50}ms` }}
                variant={city === name ? 'default' : 'outline'}
              >
                {name}
                {city === name && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-blue-600 shadow-sm">
                    ✓
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
