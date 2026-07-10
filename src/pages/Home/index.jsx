import {
  CalendarOutlined,
  CloudOutlined,
  DollarOutlined,
  DownOutlined,
  EnvironmentOutlined,
  LoginOutlined,
  RightCircleOutlined,
  RobotOutlined,
  TeamOutlined,
} from '@ant-design/icons'
/**
 * 首页组件
 * 对照 Figma 旅行落地页重构首页布局，并保留 AI 行程规划入口
 */
import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { allCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'
import './style.css'

const heroCategories = ['Mountains', 'Plains', 'Beaches']

const popularTrips = [
  {
    title: 'Trip To Scotland',
    people: '31 people going',
    city: '丽江',
    image: '/images/home/trip-scotland.jpg',
  },
  {
    title: 'Trip To Egypt',
    people: '27 people going',
    city: '西安',
    image: '/images/home/trip-egypt.jpg',
  },
  {
    title: 'Trip To Greece',
    people: '20 people going',
    city: '三亚',
    image: '/images/home/trip-greece.jpg',
  },
]

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
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  function selectCity(name) {
    setCity(name)
    setShowDropdown(false)
    fetchWeather(name)
  }

  function handleCityChange(event) {
    setCity(event.target.value)
    setShowDropdown(true)
  }

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

  function onStart() {
    if (!hasHydrated) {
      message.loading('加载中，请稍候…')
      return
    }
    if (!user)
      return navigate('/login')
    if (!city)
      return message.warning('请选择目的地')
    if (!budget)
      return message.warning('请输入预算')
    const budgetNum = Number(budget)
    if (Number.isNaN(budgetNum) || budgetNum <= 0)
      return message.warning('请输入有效的预算金额')
    navigate(`/detail?city=${encodeURIComponent(city)}&budget=${budgetNum}&days=${days}`)
  }

  function submitPlanner(event) {
    event.preventDefault()
    onStart()
  }

  function goTo(path) {
    navigate(path)
  }

  return (
    <main className="home-page" onClick={() => showDropdown && setShowDropdown(false)}>
      <section className="home-page__shell" aria-labelledby="home-title">
        <div className="home-page__backdrop home-page__backdrop--sand" aria-hidden="true" />
        <div className="home-page__backdrop home-page__backdrop--boat" aria-hidden="true">
          <img src="/images/home/hero-boat.jpg" alt="" />
        </div>
        <div className="home-page__wave" aria-hidden="true" />

        <nav className="home-page__nav" aria-label="首页导航">
          <button type="button" className="home-page__brand" onClick={() => goTo('/')} aria-label="返回首页">
            <span className="home-page__brand-mark">✈</span>
            <span className="home-page__brand-text">Travel AI</span>
          </button>

          <div className="home-page__nav-links">
            <button type="button" className="home-page__nav-link home-page__nav-link--active" onClick={() => goTo('/')}>首页</button>
            <button type="button" className="home-page__nav-link" onClick={() => goTo('/weather')}>天气</button>
            <button type="button" className="home-page__nav-link" onClick={() => goTo('/chat')}>AI 咨询</button>
            <button type="button" className="home-page__nav-link" onClick={() => selectCity('三亚')}>热门</button>
          </div>

          <button
            type="button"
            className="home-page__explore-btn"
            onClick={() => user ? onStart() : goTo('/login')}
          >
            {user ? user.username : 'Explore'}
          </button>
        </nav>

        <div className="home-page__content">
          <div className="home-page__intro">
            <div className="home-page__categories" aria-label="旅行类型">
              {heroCategories.map((item, index) => (
                <span key={item} className="home-page__category">
                  {item}
                  {index < heroCategories.length - 1 && <span className="home-page__category-divider" aria-hidden="true" />}
                </span>
              ))}
            </div>

            <h1 id="home-title" className="home-page__title">
              Spend your vacation
              <br />
              with our activities
            </h1>
            <p className="home-page__subtitle">输入城市、预算和天数，让 AI 为你生成专属旅行计划。</p>

            <div className="home-page__weather-card" aria-live="polite">
              {weather
                ? (
                    <>
                      <span className="home-page__weather-icon"><CloudOutlined /></span>
                      <span className="home-page__weather-city">{weather.city}</span>
                      <span className="home-page__weather-temp">
                        {weather.temperature}
                        °C
                      </span>
                      <span className="home-page__weather-desc">{weather.weatherDesc}</span>
                    </>
                  )
                : weatherLoading
                  ? (
                      <>
                        <span className="home-page__weather-spinner" />
                        <span>正在查询天气...</span>
                      </>
                    )
                  : (
                      <>
                        <span className="home-page__weather-icon"><EnvironmentOutlined /></span>
                        <span>选择目的地后查看实时天气</span>
                      </>
                    )}
            </div>
          </div>

          <div className="home-page__popular" aria-label="热门旅行">
            <div className="home-page__popular-head">
              <h2>Most Popular</h2>
              <RightCircleOutlined className="home-page__popular-icon" aria-hidden="true" />
            </div>
            <div className="home-page__popular-list">
              {popularTrips.map(trip => (
                <button
                  key={trip.title}
                  type="button"
                  className={`home-page__trip-card ${city === trip.city ? 'home-page__trip-card--active' : ''}`}
                  onClick={() => selectCity(trip.city)}
                >
                  <img src={trip.image} alt={trip.title} className="home-page__trip-img" />
                  <span className="home-page__trip-title">{trip.title}</span>
                  <span className="home-page__trip-meta">
                    <TeamOutlined aria-hidden="true" />
                    {trip.people}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <form className="home-page__planner" onSubmit={submitPlanner}>
          <div className="home-page__planner-panel">
            <div className="home-page__planner-fields">
              <div className="home-page__planner-field home-page__planner-field--destination" onClick={e => e.stopPropagation()}>
                <EnvironmentOutlined className="home-page__field-icon" aria-hidden="true" />
                <label className="home-page__field-content" htmlFor="home-city-input">
                  <span className="home-page__field-label">Destination</span>
                  <input
                    id="home-city-input"
                    type="text"
                    placeholder="输入搜索城市"
                    value={city}
                    onChange={handleCityChange}
                    onFocus={() => setShowDropdown(true)}
                    className="home-page__field-input"
                    autoComplete="off"
                    aria-expanded={showDropdown}
                    aria-controls="home-city-dropdown"
                  />
                </label>
                <DownOutlined className="home-page__field-caret" aria-hidden="true" />
                {showDropdown && (
                  <div id="home-city-dropdown" className="home-page__dropdown" role="listbox">
                    {filteredCities.map(name => (
                      <button
                        type="button"
                        key={name}
                        onClick={() => selectCity(name)}
                        className={`home-page__dropdown-item ${city === name ? 'home-page__dropdown-item--active' : ''}`}
                        role="option"
                        aria-selected={city === name}
                      >
                        {name}
                      </button>
                    ))}
                    {!filteredCities.length && <div className="home-page__dropdown-empty">未找到匹配城市</div>}
                  </div>
                )}
              </div>

              <div className="home-page__planner-field">
                <DollarOutlined className="home-page__field-icon" aria-hidden="true" />
                <label className="home-page__field-content" htmlFor="home-budget-input">
                  <span className="home-page__field-label">Budget</span>
                  <input
                    id="home-budget-input"
                    type="number"
                    placeholder="输入预算金额"
                    value={budget}
                    onChange={event => setBudget(event.target.value)}
                    onFocus={() => setShowDropdown(false)}
                    className="home-page__field-input"
                    min="1"
                  />
                </label>
              </div>

              <div className="home-page__planner-field">
                <CalendarOutlined className="home-page__field-icon" aria-hidden="true" />
                <div className="home-page__field-content">
                  <span className="home-page__field-label">Days</span>
                  <div className="home-page__days" aria-label="旅行天数">
                    <button
                      type="button"
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="home-page__days-btn"
                      aria-label="减少天数"
                    >
                      -
                    </button>
                    <span className="home-page__days-value">
                      {days}
                      {' '}
                      days
                    </span>
                    <button
                      type="button"
                      onClick={() => setDays(Math.min(30, days + 1))}
                      className="home-page__days-btn"
                      aria-label="增加天数"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="home-page__start-btn">
              {user ? <RobotOutlined aria-hidden="true" /> : <LoginOutlined aria-hidden="true" />}
              {user ? '开始规划' : '登录规划'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
