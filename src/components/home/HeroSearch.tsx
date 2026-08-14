/**
 * 首页 Hero 搜索区
 * 包含城市搜索（带防抖天气查询）、预算、天数输入
 */
'use client'

import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react'

import { Bot, Calendar, CircleDollarSign, Cloud, Flame, MapPin } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { allCities } from '@/constants/cities'
import { useAppToast } from '@/hooks/useAppToast'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'

export function HeroSearch() {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)

  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState(3)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { fetchWeather, loading: weatherLoading, weather } = useWeather()
  const debounceRef = useRef<null | ReturnType<typeof setTimeout>>(null)

  /* ---------- 城市搜索过滤 ---------- */

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword) return allCities
    return allCities.filter((c) => c.includes(keyword))
  }, [city])

  const activeCityId =
    showDropdown && filteredCities[activeCityIndex]
      ? `home-city-option-${activeCityIndex}`
      : undefined

  /* ---------- 表单交互函数 ---------- */

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: '' }))
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
          setActiveCityIndex((index) => Math.min(index + 1, filteredCities.length - 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (filteredCities.length) setActiveCityIndex((index) => Math.max(index - 1, 0))
      } else if (event.key === 'Enter' && showDropdown && filteredCities[activeCityIndex]) {
        event.preventDefault()
        selectCity(filteredCities[activeCityIndex])
      } else if (event.key === 'Escape') {
        setShowDropdown(false)
      }
    },
    [showDropdown, filteredCities, activeCityIndex, selectCity],
  )

  /* ---------- 防抖天气查询 ---------- */

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = city.trim()
    if (!trimmed || trimmed.length < 2) return
    debounceRef.current = setTimeout(() => {
      if (allCities.includes(trimmed)) fetchWeather(trimmed)
    }, 800)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [city, fetchWeather])

  /* ---------- 表单校验与提交 ---------- */

  const validatePlanner = useCallback(() => {
    const errors: Record<string, string> = {}
    if (!city.trim()) errors.city = '请选择目的地'
    if (!budget) errors.budget = '请输入预算'
    const budgetNum = Number(budget)
    if (budget && (Number.isNaN(budgetNum) || budgetNum <= 0)) errors.budget = '预算需大于 0'
    setFieldErrors(errors)
    return { budgetNum, isValid: Object.keys(errors).length === 0 }
  }, [city, budget])

  const onStart = useCallback(() => {
    if (!hasHydrated) {
      toast.info('加载中...')
      return
    }
    if (!user) return router.push('/login')
    const { budgetNum, isValid } = validatePlanner()
    if (!isValid) return
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
    <section aria-labelledby="home-hero-title" className="home__hero">
      <div aria-hidden="true" className="home__hero-bg">
        <div className="home__hero-gradient" />
        <div className="home__hero-pattern" />
      </div>
      <div className="home__hero-content">
        <h1 className="home__hero-title" id="home-hero-title">
          AI 旅行规划师
          <span className="home__hero-highlight">一键生成专属行程</span>
        </h1>
        <p className="home__hero-subtitle">
          输入目的地，AI 实时结合天气、预算和偏好，为你生成结构化旅行方案
        </p>

        <form className="home__search" noValidate onSubmit={submitPlanner}>
          <div className="home__search-row">
            {/* 目的地 */}
            <div
              className="home__search-field home__search-field--city"
              onClick={(e) => e.stopPropagation()}
            >
              <MapPin aria-hidden="true" className="home__search-icon" />
              <label className="home__search-label" htmlFor="home-city-input">
                <span className="home__search-label-text">目的地</span>
                <input
                  aria-activedescendant={activeCityId}
                  aria-autocomplete="list"
                  aria-controls="home-city-dropdown"
                  aria-describedby={fieldErrors.city ? 'home-city-error' : undefined}
                  aria-expanded={showDropdown}
                  aria-invalid={Boolean(fieldErrors.city)}
                  autoComplete="off"
                  className="home__search-input"
                  id="home-city-input"
                  onChange={handleCityChange}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleCityKeyDown}
                  placeholder="搜索城市"
                  role="combobox"
                  type="text"
                  value={city}
                />
                {fieldErrors.city ? (
                  <span className="home__search-error" id="home-city-error" role="alert">
                    {fieldErrors.city}
                  </span>
                ) : null}
              </label>
              {showDropdown ? (
                <div className="home__dropdown" id="home-city-dropdown" role="listbox">
                  {filteredCities.slice(0, 12).map((name, index) => (
                    <button
                      aria-selected={city === name}
                      className={`home__dropdown-item ${city === name || activeCityIndex === index ? 'home__dropdown-item--active' : ''}`}
                      id={`home-city-option-${index}`}
                      key={name}
                      onClick={() => selectCity(name)}
                      role="option"
                      type="button"
                    >
                      <MapPin aria-hidden="true" />
                      {name}
                    </button>
                  ))}
                  {filteredCities.length === 0 ? (
                    <div className="home__dropdown-empty">未找到匹配城市</div>
                  ) : null}
                </div>
              ) : null}
            </div>

            {/* 预算 */}
            <div className="home__search-field">
              <CircleDollarSign aria-hidden="true" className="home__search-icon" />
              <label className="home__search-label" htmlFor="home-budget-input">
                <span className="home__search-label-text">预算 (元)</span>
                <input
                  aria-describedby={fieldErrors.budget ? 'home-budget-error' : undefined}
                  aria-invalid={Boolean(fieldErrors.budget)}
                  className="home__search-input"
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
                {fieldErrors.budget ? (
                  <span className="home__search-error" id="home-budget-error" role="alert">
                    {fieldErrors.budget}
                  </span>
                ) : null}
              </label>
            </div>

            {/* 天数 */}
            <div className="home__search-field">
              <Calendar aria-hidden="true" className="home__search-icon" />
              <div className="home__search-label">
                <span className="home__search-label-text">天数</span>
                <div aria-label="旅行天数" className="home__days-picker">
                  <button
                    aria-label="减少天数"
                    className="home__days-btn"
                    disabled={days <= 1}
                    onClick={() => setDays((prev) => Math.max(1, prev - 1))}
                    type="button"
                  >
                    -
                  </button>
                  <span aria-live="polite" className="home__days-value">
                    {days}天
                  </span>
                  <button
                    aria-label="增加天数"
                    className="home__days-btn"
                    disabled={days >= 30}
                    onClick={() => setDays((prev) => Math.min(30, prev + 1))}
                    type="button"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 搜索按钮 */}
            <button className="home__search-btn" type="submit">
              <Bot aria-hidden="true" />
              <span>AI 规划</span>
            </button>
          </div>

          {/* 天气提示 */}
          {weather || weatherLoading ? (
            <div aria-live="polite" className="home__search-weather">
              {weatherLoading ? (
                <>
                  <span aria-hidden="true" className="home__search-weather-spin" /> 正在查询天气...
                </>
              ) : weather ? (
                <>
                  <Cloud aria-hidden="true" /> {weather.city} {weather.temperature}
                  °C {weather.weatherDesc}
                </>
              ) : null}
            </div>
          ) : null}
        </form>

        {/* 热门搜索标签 */}
        <div className="home__hot-tags">
          <span className="home__hot-tag-label">
            <Flame aria-hidden="true" /> 热门：
          </span>
          {['三亚', '丽江', '西安', '成都', '大理', '厦门'].map((tag) => (
            <button
              className="home__hot-tag"
              key={tag}
              onClick={() => selectCity(tag)}
              type="button"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
