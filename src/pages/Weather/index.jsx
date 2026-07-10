/**
 * 天气查询页面
 */
import { useMemo, useState } from 'react'
import { HomeWeather } from '@/components/HomeWeather'
import { allCities, hotCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'
import './style.css'

export default function Weather() {
  const [city, setCity] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const { weather, loading, error, fetchWeather } = useWeather()

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  function selectCity(name) {
    setCity(name)
    setShowDropdown(false)
    fetchWeather(name)
  }

  return (
    <div className="weather-page">
      <div className="weather-page__hero">
        <div className="weather-page__deco" />
        <p className="weather-page__label">WEATHER</p>
        <h1 className="weather-page__title">天气查询</h1>
        <p className="weather-page__subtitle">查看目的地实时天气，合理安排行程</p>
      </div>

      <div className="weather-page__content">
        <div className="weather-page__search" onClick={() => showDropdown && setShowDropdown(false)}>
          <div className="weather-page__search-inner" onClick={e => e.stopPropagation()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--c-ink-light)', opacity: 0.6, flexShrink: 0 }}>
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="输入城市名称查询天气"
              value={city}
              onChange={(e) => { setCity(e.target.value); setShowDropdown(true) }}
              onFocus={() => setShowDropdown(true)}
              className="weather-page__input"
            />
          </div>
          {showDropdown && (
            <div className="weather-page__dropdown">
              {filteredCities.map(name => (
                <div
                  key={name}
                  onClick={() => selectCity(name)}
                  className={`weather-page__dropdown-item ${city === name ? 'weather-page__dropdown-item--active' : ''}`}
                >
                  {name}
                </div>
              ))}
              {!filteredCities.length && <div className="weather-page__dropdown-empty">未找到匹配城市</div>}
            </div>
          )}
        </div>

        {weather && (
          <div className="weather-page__result">
            <HomeWeather weather={weather} loading={loading} />
          </div>
        )}

        {error && (
          <div className="weather-page__error">{error}</div>
        )}

        <div className="weather-page__hot">
          <div className="weather-page__hot-header">
            <div className="weather-page__hot-line" />
            <h3>热门城市</h3>
            <div className="weather-page__hot-line" />
          </div>
          <div className="weather-page__hot-list">
            {hotCities.map(name => (
              <button
                key={name}
                onClick={() => selectCity(name)}
                className={`weather-page__hot-btn ${city === name ? 'weather-page__hot-btn--active' : ''}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
