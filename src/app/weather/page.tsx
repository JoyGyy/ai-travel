'use client'

/**
 * 天气查询页面
 *
 * 提供城市搜索（带下拉联想）、气象结果透视、多城气象速览、
 * 旅人气象手记以及 AI 行程联动边栏。
 */
import type { LucideIcon } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'

import {
  ArrowRight,
  Bot,
  CalendarDays,
  Clock,
  Cloud,
  Droplets,
  Leaf,
  Lightbulb,
  MapPin,
  Search,
  Shirt,
  Sparkles,
  SunMedium,
  Thermometer,
  Umbrella,
} from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'

import { HomeWeather } from '@/components/HomeWeather'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WeatherIcon } from '@/components/WeatherIcon'
import { allCities } from '@/constants/cities'
import { QUICK_CITIES, SEASONAL_RECOMMENDS, WEATHER_KNOWLEDGE } from '@/constants/weather'
import { useWeather } from '@/hooks/useWeather'
import { getRecentCities, getWeatherTips, saveRecentCity } from '@/lib/utils/weather'

const TIP_ICONS: Record<string, LucideIcon> = {
  出行提醒: Umbrella,
  湿度提醒: Droplets,
  穿衣建议: Shirt,
  防晒提醒: SunMedium,
}

const SEASON_ICONS: Record<string, LucideIcon> = {
  夏季出游: SunMedium,
  秋季赏景: Leaf,
}

const KNOWLEDGE_ICONS: Record<string, LucideIcon> = {
  体感温度: Thermometer,
  湿度与舒适度: Droplets,
  紫外线防护: SunMedium,
}

function WeatherContent() {
  const searchParams = useSearchParams()
  const queryCity = searchParams.get('city') || searchParams.get('keyword') || ''

  const [city, setCity] = useState(queryCity)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [recentCities, setRecentCities] = useState<string[]>(() => {
    try {
      return getRecentCities()
    }
    catch {
      return []
    }
  })
  const { error, fetchWeather, loading, weather } = useWeather()

  // ---- 页面初始化：若 URL 携带 city 参数则自动搜索对应城市 ----
  useEffect(() => {
    if (queryCity) {
      const clean = queryCity.trim()
      queueMicrotask(() => {
        setCity(clean)
        fetchWeather(clean)
        saveRecentCity(clean)
        setRecentCities(getRecentCities())
      })
    }
  }, [queryCity, fetchWeather])

  // ---- 城市搜索过滤 ----
  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  // ---- 城市选择 ----
  function selectCity(name: string) {
    setCity(name)
    setActiveCityIndex(0)
    setShowDropdown(false)
    fetchWeather(name)
    saveRecentCity(name)
    setRecentCities(getRecentCities())
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
        setActiveCityIndex(index => Math.min(index + 1, filteredCities.length - 1))
    }
    else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (filteredCities.length)
        setActiveCityIndex(index => Math.max(index - 1, 0))
    }
    else if (event.key === 'Enter') {
      event.preventDefault()
      if (showDropdown && filteredCities[activeCityIndex]) {
        selectCity(filteredCities[activeCityIndex])
      }
      else if (city.trim()) {
        fetchWeather(city.trim())
        saveRecentCity(city.trim())
        setRecentCities(getRecentCities())
      }
    }
    else if (event.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  // ---- 错误重试 ----
  function retryWeather() {
    if (city.trim())
      fetchWeather(city.trim())
  }

  const weatherTips = weather
    ? getWeatherTips(weather.temperature, weather.weatherDesc, weather.humidity ?? 50)
    : []

  const currentDisplayCity = weather?.city || city || '目的地'

  return (
    <main
      className="flex-1 overflow-x-hidden overflow-y-auto bg-[#FAF7F0] min-h-dvh pb-16"
      onClick={() => showDropdown && setShowDropdown(false)}
    >
      {/* 顶部 Hero 区域 */}
      <div className="border-b border-stone-200/80 bg-[#FAF7F0] px-4 sm:px-8 lg:px-12 pb-12 pt-8 sm:pt-10">
        <div className="mx-auto max-w-[1360px]">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-3 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-2">
            <SunMedium className="w-3.5 h-3.5 text-amber-600" />
            <span>WEATHER INTELLIGENCE · 旅人气象站</span>
          </div>
          <h1
            className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight"
            id="weather-title"
          >
            实时天气感知与慢游指南
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-500">
            查询目的地实时气象与未来多日趋势，获取精准穿搭防晒贴士，让旅程因好天气而更显惬意。
          </p>
        </div>
      </div>

      {/* 主体工作台：双栏协同布局 */}
      <div className="mx-auto max-w-[1360px] px-4 sm:px-8 lg:px-12 mt-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* 左侧主内容区 (8 列)                                       */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 搜索框 */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-4 shadow-sm focus-within:border-emerald-700/60 focus-within:ring-2 focus-within:ring-emerald-700/10 sm:p-5">
                <Label className="mb-2 block text-xs font-bold text-stone-700" htmlFor="weather-city-input">
                  查询目标城市气象
                </Label>
                <div className="flex items-center gap-3">
                  <Search aria-hidden="true" className="h-5 w-5 flex-none text-emerald-800" />
                  <Input
                    aria-activedescendant={showDropdown && filteredCities[activeCityIndex] ? `weather-city-option-${activeCityIndex}` : undefined}
                    aria-autocomplete="list"
                    aria-controls="weather-city-listbox"
                    aria-expanded={showDropdown}
                    autoComplete="off"
                    className="h-11 flex-1 border-0 bg-transparent p-0 text-base font-serif font-bold text-stone-900 shadow-none focus-visible:ring-0 placeholder:text-stone-400"
                    id="weather-city-input"
                    name="weather-city"
                    onChange={handleInputChange}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="输入城市名称，例如西安、大理、杭州、成都"
                    role="combobox"
                    type="text"
                    value={city}
                  />
                  {city.trim() && (
                    <Button
                      className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 cursor-pointer"
                      onClick={() => selectCity(city.trim())}
                      size="sm"
                      type="button"
                    >
                      查询
                    </Button>
                  )}
                </div>
              </div>

              {/* 搜索下拉联想列表 */}
              {showDropdown && (
                <div
                  className="absolute left-0 right-0 z-20 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl"
                  id="weather-city-listbox"
                  role="listbox"
                >
                  {filteredCities.map((name, index) => (
                    <Button
                      aria-selected={city === name || activeCityIndex === index}
                      className={`min-h-10 w-full justify-start rounded-xl px-3.5 py-2 text-left text-xs sm:text-sm font-medium ${
                        city === name || activeCityIndex === index
                          ? 'bg-emerald-50 font-bold text-emerald-900'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                      id={`weather-city-option-${index}`}
                      key={name}
                      onClick={() => selectCity(name)}
                      role="option"
                      variant="ghost"
                    >
                      📍
                      {' '}
                      {name}
                    </Button>
                  ))}
                  {!filteredCities.length && (
                    <div className="px-4 py-4 text-center text-xs text-stone-400">
                      未找到匹配城市
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 实时天气卡片 */}
            {(loading || weather) && (
              <div className="animate-fade-in-up">
                <HomeWeather loading={loading} weather={weather} />
              </div>
            )}

            {/* 出行穿搭与防护小贴士 */}
            {weather && weatherTips.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2 animate-fade-in-up">
                {weatherTips.map((tip) => {
                  const TipIcon = TIP_ICONS[tip.title] || Lightbulb
                  return (
                    <Card className="rounded-2xl border border-stone-200/90 bg-white shadow-2xs" key={tip.title}>
                      <CardContent className="flex items-start gap-3 p-4">
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                          <TipIcon aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900">{tip.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-stone-500">{tip.text}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <div
                className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center animate-fade-in"
                role="alert"
              >
                <span className="text-xs font-semibold text-red-700">{error}</span>
                {city.trim() && (
                  <Button
                    className="border-red-200 bg-white text-red-700 hover:bg-red-50 text-xs font-bold rounded-xl"
                    onClick={retryWeather}
                    size="sm"
                    variant="outline"
                  >
                    重试
                  </Button>
                )}
              </div>
            )}

            {/* 当季宜游指南 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-amber-600" />
                <h2 className="font-serif text-base font-bold text-stone-900">当季宜游指南</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {SEASONAL_RECOMMENDS.map((item) => {
                  const SeasonIcon = SEASON_ICONS[item.season] || CalendarDays
                  return (
                    <Card className="group overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-2xs" key={item.season}>
                      <CardContent className="p-0">
                        <div className="border-b border-stone-100 bg-gradient-to-r from-emerald-50/60 to-amber-50/40 p-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs">
                              <SeasonIcon aria-hidden="true" className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="font-serif text-sm font-bold text-stone-900">{item.season}</p>
                              <p className="text-[11px] text-stone-500">{item.desc}</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex flex-wrap gap-1.5">
                            {item.cities.map(c => (
                              <Badge
                                className="cursor-pointer rounded-full bg-stone-50 border border-stone-200 text-stone-700 hover:border-emerald-700 hover:text-emerald-800 px-2.5 py-0.5 text-xs font-bold transition-all"
                                key={c}
                                onClick={() => selectCity(c)}
                                variant="secondary"
                              >
                                <MapPin className="mr-1 h-3 w-3 text-emerald-700" />
                                {c}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* 右侧气象与行程辅助边栏 (4 列，桌面端常驻充实布局)         */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* 模块 1: AI 专属行程联动卡片 */}
            <div className="rounded-3xl border border-emerald-700/20 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>AI 旅伴专属联动</span>
              </div>
              <h3 className="font-serif text-lg font-bold">
                前往【
                {currentDisplayCity}
                】旅行？
              </h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                根据实时天气，让 AI 为你量身定制避雨防晒、动静相宜的手账路线与美食清单。
              </p>
              <Link
                className="inline-flex items-center justify-between w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 px-4 py-2.5 text-xs font-black shadow-sm transition-all hover:scale-[1.02]"
                href="/chat"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span>
                    一键定制【
                    {currentDisplayCity}
                    】行程
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 模块 2: 最近查询历史 */}
            {recentCities.length > 0 && (
              <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>最近查询城市</span>
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">点击重查</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentCities.map(name => (
                    <button
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        city === name
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-600 hover:text-emerald-800'
                      }`}
                      key={name}
                      onClick={() => selectCity(name)}
                      type="button"
                    >
                      📍
                      {' '}
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 模块 3: 热门旅游城市气象速览 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-emerald-700" />
                  <span>热门城市气象速览</span>
                </span>
                <span className="text-[10px] text-stone-400">实时更新</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_CITIES.map(item => (
                  <button
                    className="p-3 rounded-2xl border border-stone-200/80 bg-white text-left transition-all hover:border-emerald-600 hover:shadow-2xs cursor-pointer group"
                    key={item.name}
                    onClick={() => selectCity(item.name)}
                    type="button"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-serif text-xs font-bold text-stone-800 group-hover:text-emerald-800">{item.name}</span>
                      <WeatherIcon className="h-4 w-4" desc={item.weather} />
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-emerald-800">{item.temp}</span>
                      <span className="text-stone-400">{item.weather}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 模块 4: 旅人气象手记与避坑指南 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-emerald-700" />
                <h3 className="font-serif text-xs font-bold text-stone-900">旅人气象手记</h3>
              </div>
              <div className="space-y-2">
                {WEATHER_KNOWLEDGE.map((item) => {
                  const KnowledgeIcon = KNOWLEDGE_ICONS[item.title] || Lightbulb
                  return (
                    <div className="p-3 rounded-2xl bg-white border border-stone-200/80 space-y-1" key={item.title}>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                        <KnowledgeIcon className="h-3.5 w-3.5 text-emerald-700" />
                        <span>{item.title}</span>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed">{item.desc}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function Weather() {
  return (
    <Suspense fallback={(
      <div className="min-h-screen bg-[#FAF7F0] flex items-center justify-center">
        <div className="text-emerald-800 text-sm font-bold animate-pulse flex items-center gap-2">
          <span>🌤️ 正在连接旅人气象台...</span>
        </div>
      </div>
    )}
    >
      <WeatherContent />
    </Suspense>
  )
}
