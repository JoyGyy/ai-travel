import {
  CalendarOutlined,
  CloudOutlined,
  CompassOutlined,
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
 * 提供旅行规划入口、热门目的地和实时天气预览
 */
import { message } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { allCities } from '@/constants/cities'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'
import './style.css'

const heroCategories = ['山野徒步', '城市漫游', '海岛假期']

const popularTrips = [
  {
    title: '丽江古城慢旅行',
    people: '31 人近期规划',
    city: '丽江',
    image: '/images/home/trip-scotland.jpg',
  },
  {
    title: '西安历史文化线',
    people: '27 人近期规划',
    city: '西安',
    image: '/images/home/trip-egypt.jpg',
  },
  {
    title: '三亚海岛度假',
    people: '20 人近期规划',
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
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState({})
  const { weather, loading: weatherLoading, fetchWeather } = useWeather()
  const debounceRef = useRef(null)

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword)
      return allCities
    return allCities.filter(c => c.includes(keyword))
  }, [city])

  const activeCityId = showDropdown && filteredCities[activeCityIndex]
    ? `home-city-option-${activeCityIndex}`
    : undefined

  function clearFieldError(field) {
    setFieldErrors(prev => ({ ...prev, [field]: '' }))
  }

  function selectCity(name) {
    setCity(name)
    clearFieldError('city')
    setShowDropdown(false)
    fetchWeather(name)
  }

  function handleCityChange(event) {
    setCity(event.target.value)
    setActiveCityIndex(0)
    clearFieldError('city')
    setShowDropdown(true)
  }

  function handleCityKeyDown(event) {
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

  function validatePlanner() {
    const errors = {}
    if (!city.trim())
      errors.city = '请选择一个目的地城市'
    if (!budget)
      errors.budget = '请输入本次旅行预算'
    const budgetNum = Number(budget)
    if (budget && (Number.isNaN(budgetNum) || budgetNum <= 0))
      errors.budget = '预算需为大于 0 的数字'
    setFieldErrors(errors)
    return { isValid: Object.keys(errors).length === 0, budgetNum }
  }

  function onStart() {
    if (!hasHydrated) {
      message.loading('加载中，请稍候…')
      return
    }
    if (!user)
      return navigate('/login')

    const { isValid, budgetNum } = validatePlanner()
    if (!isValid)
      return

    navigate(`/detail?city=${encodeURIComponent(city.trim())}&budget=${budgetNum}&days=${days}`)
  }

  function submitPlanner(event) {
    event.preventDefault()
    onStart()
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
          <Link className="home-page__brand" to="/" aria-label="返回首页">
            <span className="home-page__brand-mark" aria-hidden="true"><CompassOutlined /></span>
            <span className="home-page__brand-text">Travel AI</span>
          </Link>

          <div className="home-page__nav-links">
            <NavLink end to="/" className="home-page__nav-link">首页</NavLink>
            <NavLink to="/weather" className="home-page__nav-link">天气</NavLink>
            <NavLink to="/chat" className="home-page__nav-link">AI 咨询</NavLink>
            <button type="button" className="home-page__nav-link" onClick={() => selectCity('三亚')}>热门</button>
          </div>

          <button
            type="button"
            className="home-page__explore-btn"
            onClick={() => user ? onStart() : navigate('/login')}
          >
            {user ? '开始规划' : '登录使用'}
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
              用 AI 把灵感
              <br />
              变成可执行行程
            </h1>
            <p className="home-page__subtitle">输入城市、预算和天数，实时结合天气与知识库，为你生成结构化旅行计划。</p>

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
                        <span className="home-page__weather-spinner" aria-hidden="true" />
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
              <h2>热门灵感</h2>
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
                  <img src={trip.image} alt="" className="home-page__trip-img" />
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

        <form className="home-page__planner" onSubmit={submitPlanner} noValidate>
          <div className="home-page__planner-panel">
            <div className="home-page__planner-fields">
              <div className="home-page__planner-field home-page__planner-field--destination" onClick={e => e.stopPropagation()}>
                <EnvironmentOutlined className="home-page__field-icon" aria-hidden="true" />
                <label className="home-page__field-content" htmlFor="home-city-input">
                  <span className="home-page__field-label">目的地</span>
                  <input
                    id="home-city-input"
                    name="city"
                    type="text"
                    placeholder="输入搜索城市"
                    value={city}
                    onChange={handleCityChange}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleCityKeyDown}
                    className="home-page__field-input"
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    aria-controls="home-city-dropdown"
                    aria-activedescendant={activeCityId}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={fieldErrors.city ? 'home-city-error' : undefined}
                  />
                  {fieldErrors.city && <span id="home-city-error" className="home-page__field-error" role="alert">{fieldErrors.city}</span>}
                </label>
                <DownOutlined className="home-page__field-caret" aria-hidden="true" />
                {showDropdown && (
                  <div id="home-city-dropdown" className="home-page__dropdown" role="listbox">
                    {filteredCities.map((name, index) => (
                      <button
                        id={`home-city-option-${index}`}
                        type="button"
                        key={name}
                        onClick={() => selectCity(name)}
                        className={`home-page__dropdown-item ${city === name || activeCityIndex === index ? 'home-page__dropdown-item--active' : ''}`}
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
                  <span className="home-page__field-label">预算</span>
                  <input
                    id="home-budget-input"
                    name="budget"
                    type="number"
                    placeholder="输入预算金额"
                    value={budget}
                    onChange={(event) => { setBudget(event.target.value); clearFieldError('budget') }}
                    onFocus={() => setShowDropdown(false)}
                    className="home-page__field-input"
                    min="1"
                    inputMode="numeric"
                    aria-invalid={Boolean(fieldErrors.budget)}
                    aria-describedby={fieldErrors.budget ? 'home-budget-error' : 'home-budget-helper'}
                  />
                  {fieldErrors.budget
                    ? <span id="home-budget-error" className="home-page__field-error" role="alert">{fieldErrors.budget}</span>
                    : <span id="home-budget-helper" className="home-page__field-helper">用于估算住宿、交通和门票</span>}
                </label>
              </div>

              <div className="home-page__planner-field">
                <CalendarOutlined className="home-page__field-icon" aria-hidden="true" />
                <div className="home-page__field-content">
                  <span className="home-page__field-label">天数</span>
                  <div className="home-page__days" aria-label="旅行天数">
                    <button
                      type="button"
                      onClick={() => setDays(Math.max(1, days - 1))}
                      className="home-page__days-btn"
                      aria-label="减少天数"
                      disabled={days <= 1}
                    >
                      -
                    </button>
                    <span className="home-page__days-value" aria-live="polite">
                      {days}
                      {' '}
                      天
                    </span>
                    <button
                      type="button"
                      onClick={() => setDays(Math.min(30, days + 1))}
                      className="home-page__days-btn"
                      aria-label="增加天数"
                      disabled={days >= 30}
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
