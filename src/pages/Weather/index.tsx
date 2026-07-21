/**
 * 天气查询页面
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
  const { weather, loading, error, fetchWeather } = useWeather()

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  const activeCityId = showDropdown && filteredCities[activeCityIndex]
    ? `weather-city-option-${activeCityIndex}`
    : undefined

  function selectCity(name: string) {
    setCity(name)
    setActiveCityIndex(0)
    setShowDropdown(false)
    fetchWeather(name)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    setCity(event.target.value)
    setActiveCityIndex(0)
    setShowDropdown(true)
  }

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
      if (showDropdown && filteredCities[activeCityIndex])
        selectCity(filteredCities[activeCityIndex])
      else if (city.trim())
        fetchWeather(city.trim())
    }
    else if (event.key === 'Escape') {
      setShowDropdown(false)
    }
  }

  function retryWeather() {
    if (city.trim())
      fetchWeather(city.trim())
  }

  return (
    <main className="weather-page" onClick={() => showDropdown && setShowDropdown(false)} aria-labelledby="weather-title">
      <div className="weather-page__hero">
        <div className="weather-page__deco" aria-hidden="true" />
        <p className="weather-page__label">WEATHER</p>
        <h1 id="weather-title" className="weather-page__title">天气查询</h1>
        <p className="weather-page__subtitle">查看目的地实时天气，合理安排行程</p>
      </div>

      <div className="weather-page__content">
        <div className="weather-page__search" onClick={e => e.stopPropagation()}>
          <div className="weather-page__search-inner">
            <svg className="weather-page__search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <label className="weather-page__search-label" htmlFor="weather-city-input">城市名称</label>
            <input
              id="weather-city-input"
              name="weather-city"
              type="text"
              placeholder="输入城市名称查询天气…"
              value={city}
              onChange={handleInputChange}
              onFocus={() => setShowDropdown(true)}
              onKeyDown={handleInputKeyDown}
              className="weather-page__input"
              role="combobox"
              aria-autocomplete="list"
              aria-controls="weather-city-listbox"
              aria-expanded={showDropdown}
              aria-activedescendant={activeCityId}
              aria-haspopup="listbox"
              autoComplete="off"
            />
          </div>
          {showDropdown && (
            <div id="weather-city-listbox" className="weather-page__dropdown" role="listbox">
              {filteredCities.map((name, index) => (
                <button
                  id={`weather-city-option-${index}`}
                  key={name}
                  type="button"
                  onClick={() => selectCity(name)}
                  className={`weather-page__dropdown-item ${city === name || activeCityIndex === index ? 'weather-page__dropdown-item--active' : ''}`}
                  role="option"
                  aria-selected={city === name}
                >
                  {name}
                </button>
              ))}
              {!filteredCities.length && <div className="weather-page__dropdown-empty">未找到匹配城市</div>}
            </div>
          )}
        </div>

        {(loading || weather) && (
          <div className="weather-page__result">
            <HomeWeather weather={weather} loading={loading} />
          </div>
        )}

        {error && (
          <div className="weather-page__error" role="alert">
            <span>{error}</span>
            {city.trim() && (
              <button type="button" onClick={retryWeather} className="weather-page__retry-btn">
                重试
              </button>
            )}
          </div>
        )}

        <div className="weather-page__hot">
          <div className="weather-page__hot-header">
            <div className="weather-page__hot-line" />
            <h2>热门城市</h2>
            <div className="weather-page__hot-line" />
          </div>
          <div className="weather-page__hot-list">
            {hotCities.map(name => (
              <button
                key={name}
                type="button"
                onClick={() => selectCity(name)}
                className={`weather-page__hot-btn ${city === name ? 'weather-page__hot-btn--active' : ''}`}
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
