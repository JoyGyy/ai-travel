'use client'

/**
 * 天气查询页面
 *
 * 提供城市搜索（带下拉联想）和热门城市快捷入口，
 * 调用 useWeather hook 获取并展示实时天气数据。
 */
import type { ChangeEvent, KeyboardEvent } from 'react'

import { CalendarDays, Clock, Cloud, Droplets, Lightbulb, MapPin, Search, Star, Sun, Wind } from 'lucide-react'
import { useMemo, useState } from 'react'

import { HomeWeather } from '@/components/HomeWeather'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { allCities } from '@/constants/cities'
import { QUICK_CITIES, SEASONAL_RECOMMENDS, WEATHER_KNOWLEDGE } from '@/constants/weather'
import { useWeather } from '@/hooks/useWeather'
import { getRecentCities, getWeatherTips, saveRecentCity } from '@/lib/utils/weather'

const TIP_ICONS: Record<string, React.ReactNode> = {
  出行提醒: <Droplets size={18} />,
  湿度提醒: <Wind size={18} />,
  穿衣建议: <Sun size={18} />,
  防晒提醒: <Sun size={18} />,
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

  const activeCityId
    = showDropdown && filteredCities[activeCityIndex]
      ? `weather-city-option-${activeCityIndex}`
      : undefined

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
      aria-labelledby="weather-title"
      className="flex-1 overflow-x-hidden overflow-y-auto bg-background"
      onClick={() => showDropdown && setShowDropdown(false)}
    >
      {/* Hero 区域 */}
      <div className="relative isolate min-h-70 overflow-hidden bg-teal-50/60 p-[clamp(40px,8vw,80px)_clamp(20px,5vw,72px)_80px]">
        <div className="absolute -right-20 -top-20 h-[300px] w-[300px] animate-[morphBg_8s_ease-in-out_infinite] rounded-full bg-teal-200/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-[250px] w-[250px] rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="absolute right-[12%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-2 border-teal-200/40 bg-transparent" />

        <p className="relative mb-3 text-[11px] font-bold tracking-[0.16em] text-teal-500 animate-[fadeIn_var(--motion-choreography)_var(--ease-emphasized)_0.1s_both] uppercase">
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
        <div className="relative" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl focus-within:border-blue-300 focus-within:shadow-xl focus-within:ring-2 focus-within:ring-blue-200">
            <Search className="h-5 w-5 text-blue-500" />
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

        {/* 天气小贴士 */}
        {weather && weatherTips.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
            {weatherTips.map((tip, index) => (
              <Card
                className="border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                key={tip.title}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                    {TIP_ICONS[tip.title] || tip.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{tip.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{tip.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
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

        {/* 最近搜索 */}
        {recentCities.length > 0 && !weather && !loading && (
          <div className="mt-10 animate-fade-in-up">
            <div className="mb-4 flex items-center gap-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-600">最近搜索</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentCities.map(name => (
                <Badge
                  className="cursor-pointer border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
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
            <Separator className="mb-8 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-teal-500" />
              <h2 className="text-lg font-bold text-gray-900">多城速览</h2>
              <span className="text-xs text-gray-400">点击查看详情</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {QUICK_CITIES.map(item => (
                <Card
                  className="group cursor-pointer border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  key={item.name}
                  onClick={() => selectCity(item.name)}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${item.gradient} px-2 py-0.5 text-2.5 font-bold text-white`}>
                        {item.weather}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{item.name}</p>
                    <p className="mt-1 text-lg font-black text-gray-700">{item.temp}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 当季推荐 */}
        {!weather && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Separator className="mb-8 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-gray-900">当季推荐</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {SEASONAL_RECOMMENDS.map(item => (
                <Card
                  className="group overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  key={item.season}
                >
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-r ${item.color} p-5 text-white`}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm text-lg">
                          {item.icon}
                        </span>
                        <div>
                          <p className="text-lg font-bold">{item.season}</p>
                          <p className="text-sm opacity-80">{item.desc}</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {item.cities.map(c => (
                          <Badge
                            className="cursor-pointer transition-all hover:-translate-y-0.5"
                            key={c}
                            onClick={() => selectCity(c)}
                            variant="secondary"
                          >
                            <MapPin className="mr-1 h-3 w-3" />
                            {c}
                          </Badge>
                        ))}
                      </div>
                      <Badge className="mt-3 border-0 bg-cyan-100 text-cyan-700" variant="outline">
                        <Star className="mr-1 h-3 w-3 fill-current" />
                        {item.tag}
                        推荐
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 天气知识卡 */}
        {!weather && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Separator className="mb-8 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-cyan-500" />
              <h2 className="text-lg font-bold text-gray-900">天气小知识</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {WEATHER_KNOWLEDGE.map(item => (
                <Card
                  className="border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  key={item.title}
                >
                  <CardContent className="p-5">
                    <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white text-lg`}>
                      {item.icon}
                    </span>
                    <h3 className="mt-2 text-sm font-bold text-gray-900">{item.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
