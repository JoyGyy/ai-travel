'use client'

/**
 * 天气查询页面
 *
 * 提供城市搜索（带下拉联想）和热门城市快捷入口，
 * 调用 useWeather hook 获取并展示实时天气数据。
 */
import type { ChangeEvent, KeyboardEvent } from 'react'

import { CalendarDays, Clock, Cloud, Compass, Droplets, Lightbulb, MapPin, Search, Shirt, Star, Sun, Thermometer, Wind } from 'lucide-react'
import { useMemo, useState } from 'react'

import { HomeWeather } from '@/components/HomeWeather'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { allCities, hotCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'

// 最近搜索本地存储键
const RECENT_KEY = 'weather-recent-cities'
const MAX_RECENT = 6

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
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    {tip.icon}
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

        {/* 热门城市快捷入口 */}
        <div className="mt-12 animate-fade-in-up">
          <Separator className="mb-8 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-red-500 text-white text-sm">
              🔥
            </span>
            <h2 className="text-lg font-bold text-gray-900">热门城市</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {hotCities.map((name, index) => (
              <Button
                className={`group relative rounded-xl py-6 animate-fade-in-up ${
                  city === name
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-gray-700 shadow-sm hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600'
                }`}
                key={name}
                onClick={() => selectCity(name)}
                style={{ animationDelay: `${index * 50}ms` }}
                variant={city === name ? 'default' : 'outline'}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-base font-bold">{name}</span>
                  <span className="text-[10px] opacity-60">
                    {index < 2 ? '热门' : index < 4 ? '推荐' : '精选'}
                  </span>
                </div>
                {city === name && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] text-blue-600 shadow-sm">
                    ✓
                  </span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* 多城天气速览 */}
        {!weather && !loading && (
          <div className="mt-12 animate-fade-in-up">
            <Separator className="mb-8 bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <div className="mb-6 flex items-center gap-3">
              <Cloud className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-bold text-gray-900">多城速览</h2>
              <span className="text-xs text-gray-400">点击查看详情</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[
                { emoji: '🏖️', gradient: 'from-sky-400 to-blue-500', name: '三亚', temp: '28°C', weather: '晴' },
                { emoji: '🏔️', gradient: 'from-emerald-400 to-teal-500', name: '丽江', temp: '18°C', weather: '多云' },
                { emoji: '🏯', gradient: 'from-amber-400 to-orange-500', name: '西安', temp: '22°C', weather: '晴' },
                { emoji: '🐼', gradient: 'from-lime-400 to-green-500', name: '成都', temp: '24°C', weather: '阴' },
                { emoji: '🌊', gradient: 'from-cyan-400 to-blue-500', name: '大理', temp: '20°C', weather: '晴' },
                { emoji: '🎵', gradient: 'from-rose-400 to-pink-500', name: '厦门', temp: '26°C', weather: '多云' },
                { emoji: '🌸', gradient: 'from-fuchsia-400 to-purple-500', name: '杭州', temp: '25°C', weather: '小雨' },
                { emoji: '🏙️', gradient: 'from-slate-400 to-gray-500', name: '上海', temp: '27°C', weather: '阴' },
              ].map(item => (
                <Card
                  className="group cursor-pointer border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  key={item.name}
                  onClick={() => selectCity(item.name)}
                >
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-2xl">{item.emoji}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${item.gradient} px-2 py-0.5 text-[10px] font-bold text-white`}>
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
              {[
                {
                  color: 'from-sky-500 to-blue-600',
                  cities: ['三亚', '厦门', '青岛'],
                  desc: '阳光、沙滩、海浪，夏日避暑首选',
                  icon: <Sun size={20} />,
                  season: '夏季出游',
                  tag: '避暑',
                },
                {
                  color: 'from-amber-500 to-orange-600',
                  cities: ['西安', '北京', '南京'],
                  desc: '秋高气爽，适合历史文化深度游',
                  icon: <MapPin size={20} />,
                  season: '秋季赏景',
                  tag: '赏秋',
                },
              ].map(item => (
                <Card
                  className="group overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-lg"
                  key={item.season}
                >
                  <CardContent className="p-0">
                    <div className={`bg-gradient-to-r ${item.color} p-5 text-white`}>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
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
                      <Badge className="mt-3 border-0 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700" variant="outline">
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
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-bold text-gray-900">天气小知识</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { color: 'from-blue-500 to-cyan-500', desc: '相对湿度高于 80% 时体感闷热，低于 30% 时皮肤易干燥', icon: <Droplets size={20} />, title: '湿度与舒适度' },
                { color: 'from-orange-500 to-red-500', desc: '紫外线指数 6 以上建议涂抹 SPF30+ 防晒霜', icon: <Sun size={20} />, title: '紫外线防护' },
                { color: 'from-emerald-500 to-teal-500', desc: '气温每升高 10°C，体感温度可能高出 2-3°C', icon: <Thermometer size={20} />, title: '体感温度' },
              ].map(item => (
                <Card
                  className="border-white/60 bg-white/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md"
                  key={item.title}
                >
                  <CardContent className="p-5">
                    <span className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white`}>
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

function getRecentCities(): string[] {
  if (typeof window === 'undefined')
    return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  }
  catch {
    return []
  }
}

// 根据天气生成小贴士
function getWeatherTips(temp: number, desc: string, humidity: number, uv?: number) {
  const tips: { icon: React.ReactNode, text: string, title: string }[] = []

  // 穿衣建议
  if (temp >= 30) {
    tips.push({ icon: <Shirt size={18} />, text: '建议穿短袖、短裤，注意防暑防晒', title: '穿衣建议' })
  }
  else if (temp >= 20) {
    tips.push({ icon: <Shirt size={18} />, text: '薄外套或长袖，早晚温差注意添衣', title: '穿衣建议' })
  }
  else if (temp >= 10) {
    tips.push({ icon: <Shirt size={18} />, text: '建议穿夹克、毛衣，注意保暖', title: '穿衣建议' })
  }
  else {
    tips.push({ icon: <Shirt size={18} />, text: '厚外套、羽绒服必备，注意防寒', title: '穿衣建议' })
  }

  // 出行建议
  if (desc.includes('雨')) {
    tips.push({ icon: <Droplets size={18} />, text: '记得带伞，路面湿滑注意安全', title: '出行提醒' })
  }
  else if (desc.includes('雪')) {
    tips.push({ icon: <Droplets size={18} />, text: '注意防滑，驾车请减速慢行', title: '出行提醒' })
  }
  else if (desc.includes('晴')) {
    tips.push({ icon: <Sun size={18} />, text: '天气晴好，适合户外活动', title: '出行提醒' })
  }

  // 湿度建议
  if (humidity >= 80) {
    tips.push({ icon: <Wind size={18} />, text: '湿度较高，注意防潮除湿', title: '湿度提醒' })
  }
  else if (humidity <= 30) {
    tips.push({ icon: <Wind size={18} />, text: '空气干燥，多补充水分', title: '湿度提醒' })
  }

  // 紫外线
  if (uv && uv >= 6) {
    tips.push({ icon: <Sun size={18} />, text: '紫外线较强，外出请涂防晒霜', title: '防晒提醒' })
  }

  return tips
}

function saveRecentCity(city: string) {
  const recent = getRecentCities().filter(c => c !== city)
  recent.unshift(city)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}
