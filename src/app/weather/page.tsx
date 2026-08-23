'use client'

/**
 * 天气查询页面
 *
 * 提供城市搜索（带下拉联想）和热门城市快捷入口，
 * 调用 useWeather hook 获取并展示实时天气数据。
 */
import type { LucideIcon } from 'lucide-react'
import type { ChangeEvent, KeyboardEvent } from 'react'

import { CalendarDays, Clock, Cloud, Droplets, Leaf, Lightbulb, MapPin, Search, Shirt, Star, SunMedium, Thermometer, Umbrella } from 'lucide-react'
import { useMemo, useState } from 'react'

import { HomeWeather } from '@/components/HomeWeather'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
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

export default function Weather() {
  const [city, setCity] = useState('')
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

  return (
    <main
      className="flex-1 overflow-x-hidden overflow-y-auto bg-[#FAF7F0]"
      onClick={() => showDropdown && setShowDropdown(false)}
    >
      {/* Hero 区域 */}
      <div className="border-b border-stone-200/80 bg-[#FAF7F0] px-[clamp(20px,5vw,72px)] pb-20 pt-[clamp(36px,7vw,64px)]">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
          WEATHER INTELLIGENCE · 旅人气象站
        </p>
        <h1
          className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight"
          id="weather-title"
        >
          实时天气感知
        </h1>
        <p className="mt-2 max-w-[520px] text-xs sm:text-sm leading-relaxed text-stone-500">
          查询目的地实时气象与未来三天趋势，为慢节奏旅程准备最舒适的穿搭与装备。
        </p>
      </div>

      {/* 内容区域 */}
      <div className="relative z-[2] mx-auto -mt-11 max-w-[1120px] px-4 pb-[max(36px,env(safe-area-inset-bottom))] sm:px-6">
        {/* 搜索框 */}
        <div className="relative" onClick={e => e.stopPropagation()}>
          <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-4 shadow-md focus-within:border-emerald-700/60 focus-within:ring-2 focus-within:ring-emerald-700/10 sm:p-5">
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
                placeholder="输入城市名称，例如大理、杭州、成都"
                role="combobox"
                type="text"
                value={city}
              />
            </div>
          </div>

          {/* 下拉列表 */}
          {showDropdown && (
            <div
              className="absolute left-0 right-0 z-10 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-xl"
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

        {/* 天气结果展示 */}
        {(loading || weather) && (
          <div className="mt-6 animate-fade-in-up">
            <HomeWeather loading={loading} weather={weather} />
          </div>
        )}

        {/* 天气小贴士 */}
        {weather && weatherTips.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
            {weatherTips.map((tip) => {
              const TipIcon = TIP_ICONS[tip.title] || Lightbulb
              return (
                <Card className="border-travel-ink/8 bg-white" key={tip.title}>
                  <CardContent className="flex items-start gap-3 p-4">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/8 text-primary">
                      <TipIcon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-travel-ink">{tip.title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-travel-muted">{tip.text}</p>
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
            className="mt-6 flex flex-col items-start justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center animate-fade-in-up"
            role="alert"
          >
            <span className="text-sm font-medium text-destructive">{error}</span>
            {city.trim() && (
              <Button
                className="border-destructive/20 bg-white text-destructive hover:bg-destructive/5 hover:text-destructive"
                onClick={retryWeather}
                variant="outline"
              >
                重试
              </Button>
            )}
          </div>
        )}

        {/* 最近搜索 */}
        {recentCities.length > 0 && !weather && !loading && (
          <div className="mt-10 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-travel-ink">最近搜索</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentCities.map(name => (
                <Badge
                  className="min-h-11 cursor-pointer border-travel-ink/10 bg-white px-3 py-2 text-sm font-medium text-travel-ink transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
                  key={name}
                  onClick={() => selectCity(name)}
                  variant="outline"
                >
                  {name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 多城天气速览 */}
        {!weather && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Separator className="mb-8 bg-stone-200/80" />
            <div className="mb-6 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-emerald-800" />
              <h2 className="font-serif text-lg font-bold text-stone-900">热门城市气象速览</h2>
              <span className="text-xs text-stone-400">点击卡片快速切换</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {QUICK_CITIES.map(item => (
                <Card
                  className="group cursor-pointer rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-2xs transition-all hover:-translate-y-1 hover:border-emerald-700/60 hover:shadow-md"
                  key={item.name}
                  onClick={() => selectCity(item.name)}
                >
                  <CardContent className="p-4.5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800">
                        <WeatherIcon className="h-5 w-5" desc={item.weather} />
                      </span>
                      <span className="text-xs font-bold text-stone-500">
                        {item.weather}
                      </span>
                    </div>
                    <p className="font-serif text-sm font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">{item.name}</p>
                    <p className="mt-0.5 font-serif text-xl font-black tabular-nums text-emerald-800">{item.temp}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 当季推荐 */}
        {!weather && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Separator className="mb-8 bg-stone-200/80" />
            <div className="mb-6 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-amber-600" />
              <h2 className="font-serif text-lg font-bold text-stone-900">当季宜游指南</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {SEASONAL_RECOMMENDS.map((item) => {
                const SeasonIcon = SEASON_ICONS[item.season] || CalendarDays
                return (
                  <Card className="group overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm" key={item.season}>
                    <CardContent className="p-0">
                      <div className="border-b border-stone-200/80 bg-gradient-to-r from-emerald-50/60 to-amber-50/40 p-5">
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                            <SeasonIcon aria-hidden="true" className="h-5 w-5" />
                          </span>
                          <div>
                            <p className="font-serif text-base font-bold text-stone-900">{item.season}</p>
                            <p className="text-xs text-stone-500">{item.desc}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-2">
                          {item.cities.map(c => (
                            <Badge
                              className="cursor-pointer rounded-full bg-white border border-stone-200 text-stone-700 hover:border-emerald-700 hover:text-emerald-800 px-3 py-1 text-xs font-bold transition-all hover:-translate-y-0.5"
                              key={c}
                              onClick={() => selectCity(c)}
                              variant="secondary"
                            >
                              <MapPin className="mr-1 h-3 w-3 text-emerald-700" />
                              {c}
                            </Badge>
                          ))}
                        </div>
                        <Badge className="mt-3.5 border border-amber-300 bg-amber-100 text-amber-900 rounded-full font-bold text-xs" variant="outline">
                          <Star className="mr-1 h-3 w-3 fill-amber-500 text-amber-500" />
                          {item.tag}
                          {' '}
                          推荐
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* 天气知识卡 */}
        {!weather && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Separator className="mb-8 bg-stone-200/80" />
            <div className="mb-6 flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-emerald-800" />
              <h2 className="font-serif text-lg font-bold text-stone-900">旅人气象手记</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WEATHER_KNOWLEDGE.map((item) => {
                const KnowledgeIcon = KNOWLEDGE_ICONS[item.title] || Lightbulb
                return (
                  <Card className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm" key={item.title}>
                    <CardContent className="p-5">
                      <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                        <KnowledgeIcon aria-hidden="true" className="h-5 w-5" />
                      </span>
                      <h3 className="font-serif text-sm font-bold text-stone-900">{item.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-stone-500">{item.desc}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
