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

import './style.css'

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
      className="weather-page"
      onClick={() => showDropdown && setShowDropdown(false)}
    >
      <div className="weather-page__hero">
        <div aria-hidden="true" className="weather-page__deco" />
        <p className="weather-page__label">WEATHER</p>
        <h1 className="weather-page__title" id="weather-title">
          天气查询
        </h1>
        <p className="weather-page__subtitle">查看目的地实时天气，合理安排行程</p>
      </div>

      <div className="weather-page__content">
        <div className="weather-page__search" onClick={(e) => e.stopPropagation()}>
          <div className="weather-page__search-inner">
            <svg
              aria-hidden="true"
              className="weather-page__search-icon"
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
            <label className="weather-page__search-label" htmlFor="weather-city-input">
              城市名称
            </label>
            <input
              aria-activedescendant={activeCityId}
              aria-autocomplete="list"
              aria-controls="weather-city-listbox"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
              className="weather-page__input"
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
          {showDropdown && (
            <div className="weather-page__dropdown" id="weather-city-listbox" role="listbox">
              {filteredCities.map((name, index) => (
                <button
                  aria-selected={city === name}
                  className={`weather-page__dropdown-item ${city === name || activeCityIndex === index ? 'weather-page__dropdown-item--active' : ''}`}
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
                <div className="weather-page__dropdown-empty">未找到匹配城市</div>
              )}
            </div>
          )}
        </div>

        {/* ---- 天气结果展示 ---- */}
        {(loading || weather) && (
          <div className="weather-page__result">
            <HomeWeather loading={loading} weather={weather} />
          </div>
        )}

        {/* ---- 错误提示 ---- */}
        {error && (
          <div className="weather-page__error" role="alert">
            <span>{error}</span>
            {city.trim() && (
              <button className="weather-page__retry-btn" onClick={retryWeather} type="button">
                重试
              </button>
            )}
          </div>
        )}

        {/* ---- 热门城市快捷入口 ---- */}
        <div className="weather-page__hot">
          <div className="weather-page__hot-header">
            <div className="weather-page__hot-line" />
            <h2>热门城市</h2>
            <div className="weather-page__hot-line" />
          </div>
          <div className="weather-page__hot-list">
            {hotCities.map((name) => (
              <button
                className={`weather-page__hot-btn ${city === name ? 'weather-page__hot-btn--active' : ''}`}
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
