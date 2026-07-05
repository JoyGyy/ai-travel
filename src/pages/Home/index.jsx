/**
 * 首页组件
 * 应用的主入口页面，提供行程规划表单、热门城市推荐和实时天气
 */
import { message } from 'antd'
import { TagOutlined, EnvironmentOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HomeWeather } from '@/components/HomeWeather'
import { allCities, hotCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'
import './style.css'

export default function Home() {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState(1)
  const [showDropdown, setShowDropdown] = useState(false)
  const { weather, loading: weatherLoading, fetchWeather } = useWeather()
  const debounceRef = useRef(null)

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword) return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  function selectCity(name) {
    setCity(name)
    setShowDropdown(false)
    fetchWeather(name)
  }

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

  function onStart() {
    if (!hasHydrated) { message.loading('加载中，请稍候…'); return }
    if (!user) return navigate('/login')
    if (!city) return message.warning('请选择目的地')
    if (!budget) return message.warning('请输入预算')
    const budgetNum = Number(budget)
    if (Number.isNaN(budgetNum) || budgetNum <= 0) return message.warning('请输入有效的预算金额')
    navigate(`/detail?city=${encodeURIComponent(city)}&budget=${budgetNum}&days=${days}`)
  }

  return (
    <div className="home-page">
      {/* Hero 区域 */}
      <div className="home-page__hero">
        <div className="home-page__hero-deco1" />
        <div className="home-page__hero-deco2" />
        <div className="home-page__hero-content">
          <p className="home-page__hero-label">AI-POWERED TRAVEL</p>
          <h1 className="home-page__hero-title">
            智能旅游<br /><span>助手</span>
          </h1>
          <p className="home-page__hero-subtitle">让 AI 为你规划一段完美旅程</p>
        </div>
      </div>

      {/* 表单区域 */}
      <div className="home-page__form-wrapper" onClick={() => showDropdown && setShowDropdown(false)}>
        <div className="home-page__form">
          <div className="home-page__form-header">
            <span className="home-page__form-icon"><TagOutlined /></span>
            <span>规划你的旅行</span>
          </div>

          {/* 城市输入 */}
          <div className="home-page__field" onClick={e => e.stopPropagation()}>
            <label className="home-page__label">目的地</label>
            <div className="home-page__input-row">
              <EnvironmentOutlined className="home-page__input-icon" />
              <input
                type="text"
                placeholder="输入搜索城市"
                value={city}
                onChange={(e) => { setCity(e.target.value); setShowDropdown(true) }}
                onFocus={() => setShowDropdown(true)}
                className="home-page__input"
              />
            </div>
            {showDropdown && (
              <div className="home-page__dropdown">
                {filteredCities.map(name => (
                  <div
                    key={name}
                    onClick={() => selectCity(name)}
                    className={`home-page__dropdown-item ${city === name ? 'home-page__dropdown-item--active' : ''}`}
                  >
                    {name}
                  </div>
                ))}
                {!filteredCities.length && <div className="home-page__dropdown-empty">未找到匹配城市</div>}
              </div>
            )}
          </div>

          {/* 预算输入 */}
          <div className="home-page__field">
            <label className="home-page__label">预算 (元)</label>
            <div className="home-page__input-row">
              <DollarOutlined className="home-page__input-icon" />
              <input
                type="number"
                placeholder="输入预算金额"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="home-page__input"
              />
            </div>
          </div>

          {/* 天数选择 */}
          <div className="home-page__field">
            <label className="home-page__label">天数</label>
            <div className="home-page__input-row">
              <CalendarOutlined className="home-page__input-icon" />
              <div className="home-page__days">
                <button onClick={() => setDays(Math.max(1, days - 1))} className="home-page__days-btn">-</button>
                <span className="home-page__days-value">{days}</span>
                <button onClick={() => setDays(Math.min(30, days + 1))} className="home-page__days-btn">+</button>
              </div>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="home-page__submit">
            <button onClick={onStart} className="home-page__start-btn">开始规划</button>
          </div>
        </div>
      </div>

      {/* 天气展示 */}
      {city.trim() && allCities.includes(city.trim()) && (weather || weatherLoading) && (
        <div className="home-page__weather">
          {weather
            ? <HomeWeather weather={weather} loading={weatherLoading} />
            : (
              <div className="home-page__weather-loading">
                <div className="home-page__weather-spinner" />
                <span>正在查询天气...</span>
              </div>
            )}
        </div>
      )}

      {/* 热门城市 */}
      <div className="home-page__hot">
        <div className="home-page__hot-header">
          <div className="home-page__hot-line" />
          <h3>热门目的地</h3>
          <div className="home-page__hot-line" />
        </div>
        <div className="home-page__hot-list">
          {hotCities.map(name => (
            <button
              key={name}
              onClick={() => selectCity(name)}
              className={`home-page__hot-btn ${city === name ? 'home-page__hot-btn--active' : ''}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
