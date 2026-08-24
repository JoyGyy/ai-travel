/**
 * 首页 Hero 搜索区
 * 全屏沉浸式设计，带视差背景和浮动搜索栏
 */
'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'
import type { DateRange } from 'react-day-picker'

import type { MysteryDestination } from './AdventureMysteryBox'
import { differenceInDays, format, startOfDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import {
  Calendar,
  CircleDollarSign,
  Cloud,
  Compass,
  Dices,
  Flame,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAppToast } from '@/hooks/useAppToast'
import { useWeather } from '@/hooks/useWeather'
import { imageUrl } from '@/lib/images'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth'
import { AdventureMysteryBox } from './AdventureMysteryBox'

// 出行偏好风格标签
const TRAVEL_PREFERENCES = [
  { emoji: '🌿', key: 'nature', label: '自然疗愈' },
  { emoji: '🍜', key: 'food', label: '老饕美食' },
  { emoji: '🏛️', key: 'history', label: '历史古韵' },
  { emoji: '📸', key: 'photo', label: '出片摄影' },
  { emoji: '🏄‍♂️', key: 'hiking', label: '户外徒步' },
  { emoji: '☕', key: 'slow', label: '慢调度假' },
]

// 打字机动画文案列表
const TYPEWRITER_PHRASES = [
  '输入目的地，AI 实时结合天气、预算和偏好，为你生成专属旅行方案',
  '三亚的阳光沙滩、西安的千年古迹、成都的巴适生活… 你选哪个？',
  '预算 3000 也能玩得精彩，AI 帮你精打细算每一笔',
  '三天两夜深度游，还是七天长线慢旅行？随心定制',
  '想去的地方太多？让 AI 帮你排出最佳路线',
]

// 打字速度、停留时间、删除速度
const TYPING_SPEED = 80
const DELETING_SPEED = 40
const PAUSE_AFTER_TYPED = 2500
const PAUSE_AFTER_DELETED = 500

interface CityResult {
  adcode?: string
  level?: string
  name: string
  parent?: string
}

function TypewriterText() {
  const [typedText, setTypedText] = useState('')
  const typewriterRef = useRef({
    charIndex: 0,
    isDeleting: false,
    phraseIndex: 0,
    timer: null as null | ReturnType<typeof setTimeout>,
  })

  useEffect(() => {
    const ctx = typewriterRef.current

    const tick = () => {
      const currentPhrase = TYPEWRITER_PHRASES[ctx.phraseIndex]

      if (!ctx.isDeleting) {
        ctx.charIndex++
        setTypedText(currentPhrase.slice(0, ctx.charIndex))

        if (ctx.charIndex >= currentPhrase.length) {
          ctx.timer = setTimeout(() => {
            ctx.isDeleting = true
            tick()
          }, PAUSE_AFTER_TYPED)
          return
        }
        ctx.timer = setTimeout(tick, TYPING_SPEED)
      }
      else {
        ctx.charIndex--
        setTypedText(currentPhrase.slice(0, ctx.charIndex))

        if (ctx.charIndex <= 0) {
          ctx.isDeleting = false
          ctx.phraseIndex = (ctx.phraseIndex + 1) % TYPEWRITER_PHRASES.length
          ctx.timer = setTimeout(tick, PAUSE_AFTER_DELETED)
          return
        }
        ctx.timer = setTimeout(tick, DELETING_SPEED)
      }
    }

    ctx.timer = setTimeout(tick, 600)

    return () => {
      if (ctx.timer)
        clearTimeout(ctx.timer)
    }
  }, [])

  return (
    <p className="mx-auto max-w-[620px] text-base text-stone-200 md:text-lg">
      <span>{typedText}</span>
      <span className="inline-block h-[1.1em] w-[2px] translate-y-[2px] animate-blink bg-amber-300" />
    </p>
  )
}

export function HeroSearch() {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const [city, setCity] = useState('')
  const [cityResults, setCityResults] = useState<CityResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [budget, setBudget] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedPreference, setSelectedPreference] = useState('nature')
  const [showMysteryBox, setShowMysteryBox] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { fetchWeather, loading: weatherLoading, weather } = useWeather()
  const searchTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  // 当前显示的城市列表：仅 API 结果
  const displayCities = useMemo(() => {
    const trimmed = city.trim()
    if (trimmed.length === 0)
      return []
    if (cityResults.length > 0)
      return cityResults.map(c => c.name)
    return []
  }, [city, cityResults])

  // 计算旅行天数
  const days = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to)
      return 0
    return differenceInDays(dateRange.to, dateRange.from) + 1
  }, [dateRange])

  // 搜索城市（调用API）
  const searchCities = useCallback(async (keyword: string) => {
    if (keyword.length < 1) {
      setCityResults([])
      return
    }

    // 取消之前的请求
    if (searchAbortRef.current) {
      searchAbortRef.current.abort()
    }
    searchAbortRef.current = new AbortController()

    setIsSearching(true)
    try {
      const response = await fetch(`/api/cities?keyword=${encodeURIComponent(keyword)}`, {
        signal: searchAbortRef.current.signal,
      })
      const data = await response.json()
      if (data.success) {
        setCityResults(data.data || [])
      }
    }
    catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('城市搜索失败:', error)
      }
    }
    finally {
      setIsSearching(false)
    }
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }, [])

  const selectCity = useCallback(
    (name: string) => {
      setCity(name)
      clearFieldError('city')
      setShowDropdown(false)
      setCityResults([])
      fetchWeather(name)
    },
    [clearFieldError, fetchWeather],
  )

  const handleCityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setCity(value)
      setActiveCityIndex(0)
      clearFieldError('city')
      setShowDropdown(true)

      // debounce 搜索
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
      if (value.trim().length >= 1) {
        searchTimerRef.current = setTimeout(() => {
          searchCities(value.trim())
        }, 300)
      }
      else {
        setCityResults([])
      }
    },
    [clearFieldError, searchCities],
  )

  const handleCityKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
        setShowDropdown(true)
        return
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        if (displayCities.length)
          setActiveCityIndex(index => Math.min(index + 1, displayCities.length - 1))
      }
      else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (displayCities.length)
          setActiveCityIndex(index => Math.max(index - 1, 0))
      }
      else if (event.key === 'Enter' && showDropdown && displayCities[activeCityIndex]) {
        event.preventDefault()
        selectCity(displayCities[activeCityIndex])
      }
      else if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    },
    [showDropdown, displayCities, activeCityIndex, selectCity],
  )

  // 清理搜索定时器
  useEffect(() => {
    return () => {
      if (searchTimerRef.current)
        clearTimeout(searchTimerRef.current)
      if (searchAbortRef.current)
        searchAbortRef.current.abort()
    }
  }, [])

  const validatePlanner = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!city.trim())
      errors.city = '请选择目的地'
    if (!budget)
      errors.budget = '请输入预算'
    const budgetNum = Number(budget)
    if (budget && (Number.isNaN(budgetNum) || budgetNum <= 0))
      errors.budget = '预算需大于 0'
    if (!dateRange?.from)
      errors.date = '请选择出发日期'
    else if (!dateRange?.to)
      errors.date = '请选择返回日期'
    setFieldErrors(errors)
    return { budgetNum, isValid: Object.keys(errors).length === 0 }
  }, [city, budget, dateRange])

  const onStart = useCallback(() => {
    if (!hasHydrated) {
      toast.info('加载中...')
      return
    }
    if (!user)
      return router.push('/login')
    const { budgetNum, isValid } = validatePlanner()
    if (!isValid)
      return
    setIsSubmitting(true)
    const days = differenceInDays(dateRange!.to!, dateRange!.from!) + 1
    const prefLabel = TRAVEL_PREFERENCES.find(p => p.key === selectedPreference)?.label || '深度体验'
    const prompt = `请帮我规划一份前往【${city.trim()}】的${days}天深度旅行手账路线，总预算约 ${budgetNum} 元，出行风格偏好【${prefLabel}】。请提供详细游览路线、景点打卡时间线、地道美食推荐与交通避坑指南。`
    router.push(`/chat?city=${encodeURIComponent(city.trim())}&prompt=${encodeURIComponent(prompt)}`)
  }, [hasHydrated, user, validatePlanner, toast, dateRange, router, city, selectedPreference])

  const handleApplyMystery = useCallback((dest: MysteryDestination) => {
    setCity(dest.city)
    setBudget(String(dest.budget))
    const today = new Date()
    const returnDay = new Date()
    returnDay.setDate(today.getDate() + dest.days)
    setDateRange({ from: today, to: returnDay })
    toast.success(`✨ 已装填「${dest.city}」灵感盲盒路线，可直接生成！`)
  }, [toast])

  const submitPlanner = useCallback((e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    onStart()
  }, [onStart])

  return (
    <section

      className="planner-hero relative isolate flex min-h-[78vh] items-center overflow-hidden"
    >
      {/* 背景图片 */}
      <div className="absolute inset-0 -z-10">
        <Image
          alt=""
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src={imageUrl('/images/home/hero-boat.jpg')}
        />
        <div className="absolute inset-0 bg-linear-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-linear-to-r from-black/30 via-transparent to-black/30" />
      </div>

      <div className="relative mx-auto w-full max-w-300 px-6 py-20">
        {/* 标题区域 */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-400/30 px-4 py-1.5 backdrop-blur-md shadow-sm">
            <Sparkles size={15} className="text-amber-300" />
            <span className="text-xs font-semibold tracking-wide text-emerald-100">AI 驱动的智能旅行手账规划</span>
          </div>

          <p className="font-serif italic text-amber-200/90 text-sm md:text-base tracking-widest mb-3">
            — 每一场旅行，都是生命的一首诗 —
          </p>

          <h1
            className="mb-4 font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md"
            id="home-hero-title"
          >
            去你想去的地方，
            <span className="text-amber-300 underline decoration-emerald-400/40 decoration-wavy underline-offset-8">绘制独家手账</span>
          </h1>
          <TypewriterText />
        </div>

        {/* 灵感盲盒入口 */}
        <div className="mx-auto mb-6 max-w-[880px]">
          <div className="flex justify-center mb-3">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-950/60 px-4.5 py-1.5 text-xs font-bold text-amber-200 backdrop-blur-md transition-all hover:bg-amber-900/70 hover:scale-105 cursor-pointer shadow-sm"
              onClick={() => setShowMysteryBox(prev => !prev)}
              type="button"
            >
              <Dices className="h-4 w-4 text-amber-400" />
              {showMysteryBox ? '收起灵感盲盒 ✕' : '🎲 纠结去哪？开启目的地灵感盲盒'}
            </button>
          </div>
          {showMysteryBox && (
            <div className="mb-6 animate-fade-in-up">
              <AdventureMysteryBox onApply={handleApplyMystery} />
            </div>
          )}
        </div>

        {/* 搜索表单 (手账便签卡片) */}
        <form
          className="planner-form relative z-10 mx-auto max-w-[880px] rounded-3xl bg-[#FDFBF7]/96 backdrop-blur-xl p-6 sm:p-7 border border-stone-200/80 shadow-[0_20px_50px_rgba(28,25,23,0.14)]"
          noValidate
          onSubmit={submitPlanner}
        >
          {/* 出行偏好风格选择 */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-2 border-b border-stone-200/70 pb-4">
            <span className="text-xs font-bold text-stone-500 mr-1">出行偏好：</span>
            {TRAVEL_PREFERENCES.map(pref => (
              <button
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                  selectedPreference === pref.key
                    ? 'bg-emerald-700 text-white shadow-sm scale-105'
                    : 'bg-stone-100/90 text-stone-600 hover:bg-stone-200/80 hover:text-stone-900'
                }`}
                key={pref.key}
                onClick={() => setSelectedPreference(pref.key)}
                type="button"
              >
                <span>{pref.emoji}</span>
                <span>{pref.label}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* 目的地 */}
            <div className="relative z-20 flex-1 text-left" onClick={e => e.stopPropagation()}>
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-600" htmlFor="home-city-input">
                <MapPin className="h-3.5 w-3.5 text-emerald-700" />
                目的地
                <span className="text-amber-600">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <Input
                  autoComplete="off"
                  className="h-12 rounded-2xl border-stone-200 bg-stone-50/80 pl-10 text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                  id="home-city-input"
                  onChange={handleCityChange}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleCityKeyDown}
                  placeholder="搜索城市，如 三亚、大理、西安..."
                  type="text"
                  value={city}
                />
              </div>
              {fieldErrors.city
                ? <span className="mt-1.5 text-xs text-red-500 font-medium" id="home-city-error">{fieldErrors.city}</span>
                : null}
              {showDropdown && city.trim().length > 0
                ? (
                    <div
                      className="absolute left-0 top-full z-50 mt-2 max-h-[280px] w-full overflow-y-auto rounded-2xl border border-stone-200 bg-[#FAF7F0] py-1 shadow-2xl"
                      id="home-city-dropdown"
                    >
                      {isSearching
                        ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-stone-500">
                              <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
                              正在检索城市库...
                            </div>
                          )
                        : displayCities.length > 0
                          ? displayCities.slice(0, 10).map((name, index) => (
                              <Button
                                className={`w-full justify-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-emerald-100/70 hover:text-emerald-900 ${
                                  city === name || activeCityIndex === index
                                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                                    : 'text-stone-700'
                                }`}
                                id={`home-city-option-${index}`}
                                key={name}
                                onClick={() => selectCity(name)}
                                variant="ghost"
                              >
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-emerald-700" />
                                {name}
                              </Button>
                            ))
                          : (
                              <div className="px-4 py-6 text-center text-sm text-stone-500">未找到匹配城市</div>
                            )}
                    </div>
                  )
                : null}
            </div>

            {/* 预算 */}
            <div className="w-full text-left lg:w-[150px]">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-600" htmlFor="home-budget-input">
                <CircleDollarSign className="h-3.5 w-3.5 text-amber-600" />
                预算 (元)
                <span className="text-amber-600">*</span>
              </Label>
              <Input
                className="h-12 rounded-2xl border-stone-200 bg-stone-50/80 text-sm text-stone-900 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
                id="home-budget-input"
                inputMode="numeric"
                min="1"
                onChange={(e) => {
                  setBudget(e.target.value)
                  clearFieldError('budget')
                }}
                onFocus={() => setShowDropdown(false)}
                placeholder="3000"
                type="number"
                value={budget}
              />
              {fieldErrors.budget
                ? <span className="mt-1.5 text-xs text-red-500 font-medium" id="home-budget-error">{fieldErrors.budget}</span>
                : null}
            </div>

            {/* 出发日期 + 返回日期 */}
            <div className="flex w-full gap-2 lg:w-[320px]">
              {/* 出发日期 */}
              <div className="flex-1 text-left">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-600">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  出发日期
                  <span className="text-amber-600">*</span>
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        'h-12 w-full justify-start rounded-2xl border border-stone-200 bg-stone-50/80 px-3 text-sm font-medium text-stone-900 hover:bg-stone-100 hover:text-stone-900',
                        !dateRange?.from && 'text-stone-400',
                      )}
                      variant="ghost"
                    >
                      <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                      {dateRange?.from
                        ? format(dateRange.from, 'MM/dd', { locale: zhCN })
                        : '出发'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto rounded-2xl border-stone-200 bg-[#FAF7F0] p-0 shadow-2xl">
                    <CalendarComponent
                      defaultMonth={dateRange?.from}
                      disabled={date => date < startOfDay(new Date())}
                      locale={zhCN}
                      mode="single"
                      onSelect={(day) => {
                        if (day) {
                          setDateRange(prev => ({
                            from: day,
                            to: prev?.to && prev.to > day ? prev.to : undefined,
                          }))
                          clearFieldError('date')
                        }
                      }}
                      selected={dateRange?.from}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 返回日期 */}
              <div className="flex-1 text-left">
                <span className="mb-2 flex items-center gap-1.5 text-xs font-bold text-stone-600">
                  <Calendar className="h-3.5 w-3.5 text-emerald-700" />
                  返回日期
                  <span className="text-amber-600">*</span>
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className={cn(
                        'h-12 w-full justify-start rounded-2xl border border-stone-200 bg-stone-50/80 px-3 text-sm font-medium text-stone-900 hover:bg-stone-100 hover:text-stone-900',
                        !dateRange?.to && 'text-stone-400',
                      )}
                      disabled={!dateRange?.from}
                      variant="ghost"
                    >
                      <Calendar className="mr-1.5 h-4 w-4 flex-shrink-0 text-emerald-700" />
                      {dateRange?.to
                        ? (
                            <>
                              {format(dateRange.to, 'MM/dd', { locale: zhCN })}
                              <span className="ml-1 text-xs text-amber-700 font-bold">
                                (
                                {days}
                                天)
                              </span>
                            </>
                          )
                        : '返回'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-auto rounded-2xl border-stone-200 bg-[#FAF7F0] p-0 shadow-2xl">
                    <CalendarComponent
                      defaultMonth={dateRange?.from}
                      disabled={date => date <= (dateRange?.from ?? startOfDay(new Date()))}
                      locale={zhCN}
                      mode="single"
                      onSelect={(day) => {
                        if (day) {
                          setDateRange(prev => ({
                            from: prev?.from,
                            to: day,
                          }))
                          clearFieldError('date')
                        }
                      }}
                      selected={dateRange?.to}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 日期错误提示 */}
            {fieldErrors.date
              ? (
                  <div className="w-full text-left lg:w-[320px]">
                    <span className="text-xs text-red-500 font-medium" id="home-date-error">{fieldErrors.date}</span>
                  </div>
                )
              : null}

            {/* 搜索按钮 */}
            <Button
              className="h-12 gap-2 rounded-2xl bg-emerald-700 px-8 text-sm font-bold text-white shadow-lg shadow-emerald-800/25 hover:bg-emerald-800 disabled:hover:bg-emerald-700 lg:w-auto cursor-pointer transition-all hover:scale-[1.02]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>生成手账中...</span>
                    </>
                  )
                : (
                    <>
                      <Compass className="h-4 w-4" />
                      <span>生成行程手账</span>
                    </>
                  )}
            </Button>
          </div>

          {/* 天气提示 */}
          {weather || weatherLoading
            ? (
                <div className="mt-4 flex items-center gap-2 text-xs text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded-xl w-max">
                  {weatherLoading
                    ? (
                        <>
                          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700" />
                          正在查询当地气象...
                        </>
                      )
                    : weather
                      ? (
                          <>
                            <Cloud className="h-3.5 w-3.5 text-sky-600" />
                            <span>{weather.city}</span>
                            <span className="font-bold text-stone-800">
                              {weather.temperature}
                              °C
                            </span>
                            <span>{weather.weatherDesc}</span>
                          </>
                        )
                      : null}
                </div>
              )
            : null}
        </form>

        {/* 热门搜索标签 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1 text-xs text-stone-300 font-medium">
            <Flame className="h-3.5 w-3.5 text-amber-300" />
            热门手账：
          </span>
          {['洱海慢生活', '大唐古都西安', '川西甘孜自驾', '三亚椰林落日', '丽江古城', '厦门小资'].map(tag => (
            <Badge
              className="cursor-pointer border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-stone-100 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 hover:border-emerald-500 hover:text-white rounded-full shadow-2xs"
              key={tag}
              onClick={() => selectCity(tag.replace(/慢生活|古都|自驾|椰林落日|古城|小资/g, ''))}
              variant="outline"
            >
              🌿
              {' '}
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* 底部渐变过渡 */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAF7F0] to-transparent" />
    </section>
  )
}
