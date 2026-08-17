/**
 * 首页 Hero 搜索区
 * 包含城市搜索（带防抖天气查询）、预算、天数输入
 */
'use client'

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'

import { Bot, Calendar, CircleDollarSign, Cloud, Flame, Loader2, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { allCities } from '@/constants/cities'
import { useAppToast } from '@/hooks/useAppToast'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'

export function HeroSearch() {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState(3)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { fetchWeather, loading: weatherLoading, weather } = useWeather()
  const debounceRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  /* ---------- 城市搜索过滤 ---------- */

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  const activeCityId
    = showDropdown && filteredCities[activeCityIndex]
      ? `home-city-option-${activeCityIndex}`
      : undefined

  /* ---------- 表单交互函数 ---------- */

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }, [])

  const selectCity = useCallback(
    (name: string) => {
      setCity(name)
      clearFieldError('city')
      setShowDropdown(false)
      fetchWeather(name)
    },
    [clearFieldError, fetchWeather],
  )

  const handleCityChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setCity(event.target.value)
      setActiveCityIndex(0)
      clearFieldError('city')
      setShowDropdown(true)
    },
    [clearFieldError],
  )

  const handleCityKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
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
      else if (event.key === 'Enter' && showDropdown && filteredCities[activeCityIndex]) {
        event.preventDefault()
        selectCity(filteredCities[activeCityIndex])
      }
      else if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    },
    [showDropdown, filteredCities, activeCityIndex, selectCity],
  )

  /* ---------- 防抖天气查询 ---------- */

  useEffect(() => {
    if (debounceRef.current)
      clearTimeout(debounceRef.current)
    const trimmed = city.trim()
    if (!trimmed || trimmed.length < 2)
      return
    debounceRef.current = setTimeout(() => {
      if (allCities.includes(trimmed))
        fetchWeather(trimmed)
    }, 800)
    return () => {
      if (debounceRef.current)
        clearTimeout(debounceRef.current)
    }
  }, [city, fetchWeather])

  /* ---------- 表单校验与提交 ---------- */

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
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      onStart()
    },
    [onStart],
  )

  return (
    <section
      aria-labelledby="home-hero-title"
      className="relative overflow-hidden bg-gradient-to-br from-orange-50/80 via-amber-50/60 to-rose-50/50 py-16"
    >
      {/* 背景装饰 */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,107,53,0.12),transparent)]" />
        <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_1px_1px,#1c1917_1px,transparent_0)] [background-size:24px_24px]" />
      </div>

      <div className="relative mx-auto max-w-[900px] px-6 text-center">
        <h1
          className="mb-3 text-4xl font-black tracking-tight text-travel-ink"
          id="home-hero-title"
        >
          AI 旅行规划师
          <span className="ml-2 bg-gradient-to-r from-primary to-amber-500 bg-clip-text text-transparent">
            一键生成专属行程
          </span>
        </h1>
        <p className="mx-auto mb-10 max-w-[540px] text-base text-travel-muted">
          输入目的地，AI 实时结合天气、预算和偏好，为你生成结构化旅行方案
        </p>

        <form
          className="mx-auto max-w-[780px] rounded-2xl bg-white p-5 shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          noValidate
          onSubmit={submitPlanner}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            {/* 目的地 */}
            <div className="relative flex-1 text-left" onClick={e => e.stopPropagation()}>
              <Label
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-travel-muted"
                htmlFor="home-city-input"
              >
                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                目的地
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                aria-activedescendant={activeCityId}
                aria-autocomplete="list"
                aria-controls="home-city-dropdown"
                aria-describedby={fieldErrors.city ? 'home-city-error' : undefined}
                aria-expanded={showDropdown}
                aria-invalid={Boolean(fieldErrors.city)}
                autoComplete="off"
                className="w-full rounded-lg border-travel-border-light bg-travel-surface py-2.5 text-sm"
                id="home-city-input"
                onChange={handleCityChange}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleCityKeyDown}
                placeholder="搜索城市"
                role="combobox"
                type="text"
                value={city}
              />
              {fieldErrors.city
                ? (
                    <span className="mt-1 text-xs text-red-500" id="home-city-error" role="alert">
                      {fieldErrors.city}
                    </span>
                  )
                : null}
              {showDropdown
                ? (
                    <div
                      className="absolute left-0 top-full z-50 mt-1 max-h-[280px] w-full overflow-y-auto rounded-xl border border-travel-border-light bg-white py-1 shadow-lg"
                      id="home-city-dropdown"
                      role="listbox"
                    >
                      {filteredCities.slice(0, 12).map((name, index) => (
                        <Button
                          aria-selected={city === name}
                          className={`w-full justify-start gap-2 px-3 py-2 text-left text-sm ${
                            city === name || activeCityIndex === index
                              ? 'bg-primary/8 text-primary'
                              : 'text-travel-ink'
                          }`}
                          id={`home-city-option-${index}`}
                          key={name}
                          onClick={() => selectCity(name)}
                          role="option"
                          variant="ghost"
                        >
                          <MapPin aria-hidden="true" className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                          {name}
                        </Button>
                      ))}
                      {filteredCities.length === 0
                        ? (
                            <div className="px-3 py-4 text-center text-sm text-travel-muted">
                              未找到匹配城市
                            </div>
                          )
                        : null}
                    </div>
                  )
                : null}
            </div>

            {/* 预算 */}
            <div className="w-full text-left sm:w-[140px]">
              <Label
                className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-travel-muted"
                htmlFor="home-budget-input"
              >
                <CircleDollarSign aria-hidden="true" className="h-3.5 w-3.5" />
                预算 (元)
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                aria-describedby={fieldErrors.budget ? 'home-budget-error' : undefined}
                aria-invalid={Boolean(fieldErrors.budget)}
                className="w-full rounded-lg border-travel-border-light bg-travel-surface py-2.5 text-sm"
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
                ? (
                    <span className="mt-1 text-xs text-red-500" id="home-budget-error" role="alert">
                      {fieldErrors.budget}
                    </span>
                  )
                : null}
            </div>

            {/* 天数 */}
            <div className="w-full text-left sm:w-[120px]">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-travel-muted">
                <Calendar aria-hidden="true" className="h-3.5 w-3.5" />
                天数
              </span>
              <div
                aria-label="旅行天数"
                className="flex items-center overflow-hidden rounded-lg border border-travel-border-light bg-travel-surface"
              >
                <Button
                  aria-label="减少天数"
                  className="h-[42px] w-10 text-lg text-travel-muted"
                  disabled={days <= 1}
                  onClick={() => setDays(prev => Math.max(1, prev - 1))}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  -
                </Button>
                <span
                  aria-live="polite"
                  className="flex-1 text-center text-sm font-medium text-travel-ink"
                >
                  {days}
                  天
                </span>
                <Button
                  aria-label="增加天数"
                  className="h-[42px] w-10 text-lg text-travel-muted"
                  disabled={days >= 30}
                  onClick={() => setDays(prev => Math.min(30, prev + 1))}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  +
                </Button>
              </div>
            </div>

            {/* 搜索按钮 */}
            <Button
              aria-label={isSubmitting ? '正在生成行程' : 'AI 规划行程'}
              className="h-[42px] gap-2 bg-primary px-6 text-sm font-bold shadow-[0_4px_12px_rgba(255,107,53,0.3)] hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-[0_6px_16px_rgba(255,107,53,0.4)] active:translate-y-0 disabled:hover:translate-y-0 disabled:hover:shadow-[0_4px_12px_rgba(255,107,53,0.3)]"
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
                <div
                  aria-live="polite"
                  className="mt-3 flex items-center gap-2 text-sm text-travel-muted"
                >
                  {weatherLoading
                    ? (
                        <>
                          <span
                            aria-hidden="true"
                            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-travel-border border-t-primary"
                          />
                          正在查询天气...
                        </>
                      )
                    : weather
                      ? (
                          <>
                            <Cloud aria-hidden="true" className="h-4 w-4 text-sky-500" />
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
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="flex items-center gap-1 text-sm text-travel-muted">
            <Flame aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
            热门：
          </span>
          {['三亚', '丽江', '西安', '成都', '大理', '厦门'].map(tag => (
            <Badge
              className="cursor-pointer border-travel-border-light bg-white px-3 py-1 text-xs font-medium text-travel-ink transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              key={tag}
              onClick={() => selectCity(tag)}
              variant="outline"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}
