/**
 * 首页 Hero 搜索区
 * 全屏沉浸式设计，带视差背景和浮动搜索栏
 */
'use client'

import type { ChangeEvent, KeyboardEvent } from 'react'

import { Bot, Calendar, CircleDollarSign, Cloud, Flame, Loader2, MapPin, Search } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { allCities } from '@/constants/cities'
import { useAppToast } from '@/hooks/useAppToast'
import { useWeather } from '@/hooks/useWeather'
import { imageUrl } from '@/lib/images'
import { useAuthStore } from '@/stores/auth'

interface CityResult {
  adcode?: string
  level?: string
  name: string
  parent?: string
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
  const [days, setDays] = useState(3)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { fetchWeather, loading: weatherLoading, weather } = useWeather()
  const searchTimerRef = useRef<null | ReturnType<typeof setTimeout>>(null)
  const searchAbortRef = useRef<AbortController | null>(null)

  // 当前显示的城市列表：API结果或本地过滤
  const displayCities = useMemo(() => {
    const trimmed = city.trim()
    if (trimmed.length === 0)
      return []
    if (cityResults.length > 0)
      return cityResults.map(c => c.name)
    return allCities.filter(c => c.includes(trimmed))
  }, [city, cityResults])

  const activeCityId
    = showDropdown && displayCities[activeCityIndex]
      ? `home-city-option-${activeCityIndex}`
      : undefined

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
    setFieldErrors(errors)
    return { budgetNum, isValid: Object.keys(errors).length === 0 }
  }, [city, budget])

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
    router.push(`/detail?city=${encodeURIComponent(city.trim())}&budget=${budgetNum}&days=${days}`)
  }, [hasHydrated, user, router, validatePlanner, city, days, toast])

  const submitPlanner = useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault()
      onStart()
    },
    [onStart],
  )

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative isolate min-h-[85vh] flex items-center overflow-hidden"
    >
      {/* 背景图片 */}
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <Image
          alt=""
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src={imageUrl('/images/home/hero-boat.jpg')}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      </div>

      {/* 装饰光晕 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-20 left-[10%] h-72 w-72 rounded-full bg-teal-500/10 blur-[100px]" />
        <div className="absolute bottom-20 right-[10%] h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[1200px] px-6 py-20">
        {/* 标题区域 */}
        <div className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
            <Bot size={16} className="text-teal-400" />
            <span className="text-sm font-medium text-white/90">AI 驱动的智能旅行规划</span>
          </div>
          <h1
            className="mb-6 text-5xl font-black tracking-tight text-white drop-shadow-lg md:text-6xl lg:text-7xl"
            id="home-hero-title"
          >
            去你想去的地方
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-sky-400 bg-clip-text text-transparent">
              AI 帮你规划
            </span>
          </h1>
          <p className="mx-auto max-w-[600px] text-lg text-white/80 md:text-xl">
            输入目的地，AI 实时结合天气、预算和偏好，为你生成专属旅行方案
          </p>
        </div>

        {/* 搜索表单 */}
        <form
          className="relative z-10 mx-auto max-w-[860px] rounded-3xl bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
          noValidate
          onSubmit={submitPlanner}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* 目的地 */}
            <div className="relative z-20 flex-1 text-left" onClick={e => e.stopPropagation()}>
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500" htmlFor="home-city-input">
                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                目的地
                <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  aria-activedescendant={activeCityId}
                  aria-autocomplete="list"
                  aria-controls="home-city-dropdown"
                  aria-describedby={fieldErrors.city ? 'home-city-error' : undefined}
                  aria-expanded={showDropdown}
                  aria-invalid={Boolean(fieldErrors.city)}
                  autoComplete="off"
                  className="h-12 rounded-xl border-gray-200 bg-gray-50 pl-10 text-sm focus:bg-white"
                  id="home-city-input"
                  onChange={handleCityChange}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleCityKeyDown}
                  placeholder="搜索城市，如 三亚、成都、西安..."
                  role="combobox"
                  type="text"
                  value={city}
                />
              </div>
              {fieldErrors.city
                ? <span className="mt-1.5 text-xs text-red-500" id="home-city-error" role="alert">{fieldErrors.city}</span>
                : null}
              {showDropdown && city.trim().length > 0
                ? (
                    <div
                      className="absolute left-0 top-full z-50 mt-2 max-h-[280px] w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-xl"
                      id="home-city-dropdown"
                      role="listbox"
                    >
                      {isSearching
                        ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-gray-400">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              搜索中...
                            </div>
                          )
                        : displayCities.length > 0
                          ? displayCities.slice(0, 10).map((name, index) => (
                              <Button
                                aria-selected={city === name}
                                className={`w-full justify-start gap-2 px-4 py-2.5 text-left text-sm hover:bg-teal-50 hover:text-teal-700 ${
                                  city === name || activeCityIndex === index
                                    ? 'bg-teal-50 text-teal-600'
                                    : 'text-gray-700'
                                }`}
                                id={`home-city-option-${index}`}
                                key={name}
                                onClick={() => selectCity(name)}
                                role="option"
                                variant="ghost"
                              >
                                <MapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
                                {name}
                              </Button>
                            ))
                          : (
                              <div className="px-4 py-6 text-center text-sm text-gray-400">未找到匹配城市</div>
                            )}
                    </div>
                  )
                : null}
            </div>

            {/* 预算 */}
            <div className="w-full text-left lg:w-[150px]">
              <Label className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500" htmlFor="home-budget-input">
                <CircleDollarSign aria-hidden="true" className="h-3.5 w-3.5" />
                预算 (元)
                <span className="text-red-500">*</span>
              </Label>
              <Input
                aria-describedby={fieldErrors.budget ? 'home-budget-error' : undefined}
                aria-invalid={Boolean(fieldErrors.budget)}
                className="h-12 rounded-xl border-gray-200 bg-gray-50 text-sm focus:bg-white"
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
                ? <span className="mt-1.5 text-xs text-red-500" id="home-budget-error" role="alert">{fieldErrors.budget}</span>
                : null}
            </div>

            {/* 天数 */}
            <div className="w-full text-left lg:w-[130px]">
              <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
                天数
              </span>
              <div aria-label="旅行天数" className="flex h-12 items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                <Button aria-label="减少天数" className="h-full w-12 text-lg text-gray-400 hover:bg-gray-100" disabled={days <= 1} onClick={() => setDays(prev => Math.max(1, prev - 1))} size="icon" type="button" variant="ghost">-</Button>
                <span aria-live="polite" className="flex-1 text-center text-sm font-bold text-gray-900">
                  {days}
                  天
                </span>
                <Button aria-label="增加天数" className="h-full w-12 text-lg text-gray-400 hover:bg-gray-100" disabled={days >= 30} onClick={() => setDays(prev => Math.min(30, prev + 1))} size="icon" type="button" variant="ghost">+</Button>
              </div>
            </div>

            {/* 搜索按钮 */}
            <Button
              aria-label={isSubmitting ? '正在生成行程' : 'AI 规划行程'}
              className="h-12 gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-slate-600 px-8 text-sm font-bold text-white shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30 disabled:hover:shadow-lg lg:w-auto"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting
                ? (
                    <>
                      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      <span>生成中...</span>
                    </>
                  )
                : (
                    <>
                      <Bot aria-hidden="true" className="h-4 w-4" />
                      <span>AI 规划</span>
                    </>
                  )}
            </Button>
          </div>

          {/* 天气提示 */}
          {weather || weatherLoading
            ? (
                <div aria-live="polite" className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                  {weatherLoading
                    ? (
                        <>
                          <span aria-hidden="true" className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-teal-500" />
                          正在查询天气...
                        </>
                      )
                    : weather
                      ? (
                          <>
                            <Cloud aria-hidden="true" className="h-4 w-4 text-blue-500" />
                            {weather.city}
                            {' '}
                            {weather.temperature}
                            °C
                            {' '}
                            {weather.weatherDesc}
                          </>
                        )
                      : null}
                </div>
              )
            : null}
        </form>

        {/* 热门搜索标签 */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1 text-sm text-white/60">
            <Flame aria-hidden="true" className="h-3.5 w-3.5 text-teal-400" />
            热门：
          </span>
          {['三亚', '丽江', '西安', '成都', '大理', '厦门'].map(tag => (
            <Badge
              className="cursor-pointer border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:bg-white/20 hover:text-white"
              key={tag}
              onClick={() => selectCity(tag)}
              variant="outline"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* 底部渐变过渡 */}
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  )
}
