import {
  CalendarOutlined,
  CloudOutlined,
  CompassOutlined,
  DollarOutlined,
  EnvironmentOutlined,
  FireOutlined,
  HomeOutlined,
  LoginOutlined,
  RobotOutlined,
  StarOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons'
/**
 * 首页组件 - OTA 旅行平台风格
 * 丰富内容展示、暖色调、参考携程/飞猪布局
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { allCities } from '@/constants/cities'
import { useAppMessage } from '@/hooks/useAppMessage'
import { useWeather } from '@/hooks/useWeather'
import { useAuthStore } from '@/stores/auth'
import './style.css'

/* 快捷入口 */
const quickEntries = [
  { icon: <HomeOutlined />, label: '酒店民宿', color: '#FF6B35' },
  { icon: <CompassOutlined />, label: 'AI 行程', color: '#F59E0B' },
  { icon: <CloudOutlined />, label: '天气查询', color: '#3B82F6' },
  { icon: <RobotOutlined />, label: 'AI 咨询', color: '#E84057' },
]

/* 热门目的地 */
const hotDestinations = [
  { name: '三亚', tag: '海岛度假', img: '/images/home/trip-greece.jpg', temp: '28°C', price: '¥2,899起' },
  { name: '丽江', tag: '古城慢游', img: '/images/home/trip-scotland.jpg', temp: '18°C', price: '¥1,599起' },
  { name: '西安', tag: '历史探秘', img: '/images/home/trip-egypt.jpg', temp: '22°C', price: '¥1,299起' },
  { name: '成都', tag: '美食之都', img: '/images/home/trip-scotland.jpg', temp: '24°C', price: '¥1,499起' },
  { name: '大理', tag: '风花雪月', img: '/images/home/trip-greece.jpg', temp: '20°C', price: '¥1,899起' },
  { name: '厦门', tag: '文艺小城', img: '/images/home/trip-egypt.jpg', temp: '26°C', price: '¥1,699起' },
]

/* 精选推荐 */
const featuredTrips = [
  {
    title: '三亚 5 天 4 晚海岛深度游',
    desc: '蜈支洲岛 + 亚龙湾 + 南山寺，含五星酒店',
    image: '/images/home/trip-greece.jpg',
    tag: '人气爆款',
    rating: 4.9,
    reviews: 2341,
    price: 3299,
    originalPrice: 4599,
    city: '三亚',
  },
  {
    title: '丽江古城 + 玉龙雪山 4 日游',
    desc: '纳西古韵 + 雪山索道 + 蓝月谷',
    image: '/images/home/trip-scotland.jpg',
    tag: '限时特惠',
    rating: 4.8,
    reviews: 1856,
    price: 2199,
    originalPrice: 3199,
    city: '丽江',
  },
  {
    title: '西安兵马俑 + 华清池 3 日文化之旅',
    desc: '世界遗产 + 回民街美食 + 大唐不夜城',
    image: '/images/home/trip-egypt.jpg',
    tag: '周末可用',
    rating: 4.7,
    reviews: 1523,
    price: 1699,
    originalPrice: 2499,
    city: '西安',
  },
]

/* 用户评价 */
const userReviews = [
  { name: '小王', avatar: '王', dest: '三亚', text: 'AI 规划的行程太省心了！每天节奏刚好，酒店推荐也很赞。', rating: 5 },
  { name: '阿丽', avatar: '丽', dest: '丽江', text: '第一次用 AI 做旅行攻略，比自己查攻略高效 10 倍！', rating: 5 },
  { name: '老张', avatar: '张', dest: '西安', text: '带爸妈出行，行程安排考虑了老人家体力，很贴心。', rating: 5 },
]

export default function Home() {
  const navigate = useNavigate()
  const message = useAppMessage()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)
  const [city, setCity] = useState('')
  const [budget, setBudget] = useState('')
  const [days, setDays] = useState(3)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeCityIndex, setActiveCityIndex] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const { weather, loading: weatherLoading, fetchWeather } = useWeather()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filteredCities = useMemo(() => {
    const keyword = city.trim()
    if (!keyword) return allCities
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
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = city.trim()
    if (!trimmed || trimmed.length < 2) return
    debounceRef.current = setTimeout(() => {
      if (allCities.includes(trimmed)) fetchWeather(trimmed)
    }, 800)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [city, fetchWeather])

  function validatePlanner() {
    const errors: Record<string, string> = {}
    if (!city.trim()) errors.city = '请选择目的地'
    if (!budget) errors.budget = '请输入预算'
    const budgetNum = Number(budget)
    if (budget && (Number.isNaN(budgetNum) || budgetNum <= 0))
      errors.budget = '预算需大于 0'
    setFieldErrors(errors)
    return { isValid: Object.keys(errors).length === 0, budgetNum }
  }

  function onStart() {
    if (!hasHydrated) {
      message.loading('加载中...')
      return
    }
    if (!user) return navigate('/login')
    const { isValid, budgetNum } = validatePlanner()
    if (!isValid) return
    navigate(`/detail?city=${encodeURIComponent(city.trim())}&budget=${budgetNum}&days=${days}`)
  }

  function submitPlanner(event) {
    event.preventDefault()
    onStart()
  }

  return (
    <main className="home" onClick={() => showDropdown && setShowDropdown(false)}>
      {/* 顶部导航 */}
      <header className="home__header">
        <div className="home__header-inner">
          <Link className="home__brand" to="/" aria-label="返回首页">
            <span className="home__brand-icon"><CompassOutlined /></span>
            <span className="home__brand-name">TravelAI</span>
          </Link>
          <nav className="home__nav" aria-label="主导航">
            <NavLink end to="/" className="home__nav-link home__nav-link--active">首页</NavLink>
            <NavLink to="/weather" className="home__nav-link">天气</NavLink>
            <NavLink to="/chat" className="home__nav-link">AI 咨询</NavLink>
          </nav>
          <div className="home__header-right">
            {user
              ? <span className="home__user-badge"><UserOutlined /> {user.username || '用户'}</span>
              : <Link to="/login" className="home__login-btn"><LoginOutlined /> 登录 / 注册</Link>}
          </div>
        </div>
      </header>

      {/* Hero 搜索区 */}
      <section className="home__hero" aria-labelledby="home-hero-title">
        <div className="home__hero-bg" aria-hidden="true">
          <div className="home__hero-gradient" />
          <div className="home__hero-pattern" />
        </div>
        <div className="home__hero-content">
          <h1 id="home-hero-title" className="home__hero-title">
            AI 旅行规划师
            <span className="home__hero-highlight">一键生成专属行程</span>
          </h1>
          <p className="home__hero-subtitle">
            输入目的地，AI 实时结合天气、预算和偏好，为你生成结构化旅行方案
          </p>

          {/* 搜索表单 */}
          <form className="home__search" onSubmit={submitPlanner} noValidate>
            <div className="home__search-row">
              {/* 目的地 */}
              <div className="home__search-field home__search-field--city" onClick={e => e.stopPropagation()}>
                <EnvironmentOutlined className="home__search-icon" aria-hidden="true" />
                <label className="home__search-label" htmlFor="home-city-input">
                  <span className="home__search-label-text">目的地</span>
                  <input
                    id="home-city-input"
                    type="text"
                    placeholder="搜索城市"
                    value={city}
                    onChange={handleCityChange}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleCityKeyDown}
                    className="home__search-input"
                    autoComplete="off"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={showDropdown}
                    aria-controls="home-city-dropdown"
                    aria-activedescendant={activeCityId}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={fieldErrors.city ? 'home-city-error' : undefined}
                  />
                  {fieldErrors.city
                    ? <span id="home-city-error" className="home__search-error" role="alert">{fieldErrors.city}</span>
                    : null}
                </label>
                {showDropdown
                  ? (
                      <div id="home-city-dropdown" className="home__dropdown" role="listbox">
                        {filteredCities.slice(0, 12).map((name, index) => (
                          <button
                            id={`home-city-option-${index}`}
                            type="button"
                            key={name}
                            onClick={() => selectCity(name)}
                            className={`home__dropdown-item ${city === name || activeCityIndex === index ? 'home__dropdown-item--active' : ''}`}
                            role="option"
                            aria-selected={city === name}
                          >
                            <EnvironmentOutlined aria-hidden="true" />
                            {name}
                          </button>
                        ))}
                        {filteredCities.length === 0
                          ? <div className="home__dropdown-empty">未找到匹配城市</div>
                          : null}
                      </div>
                    )
                  : null}
              </div>

              {/* 预算 */}
              <div className="home__search-field">
                <DollarOutlined className="home__search-icon" aria-hidden="true" />
                <label className="home__search-label" htmlFor="home-budget-input">
                  <span className="home__search-label-text">预算 (元)</span>
                  <input
                    id="home-budget-input"
                    type="number"
                    placeholder="3000"
                    value={budget}
                    onChange={(e) => { setBudget(e.target.value); clearFieldError('budget') }}
                    onFocus={() => setShowDropdown(false)}
                    className="home__search-input"
                    min="1"
                    inputMode="numeric"
                    aria-invalid={Boolean(fieldErrors.budget)}
                    aria-describedby={fieldErrors.budget ? 'home-budget-error' : undefined}
                  />
                  {fieldErrors.budget
                    ? <span id="home-budget-error" className="home__search-error" role="alert">{fieldErrors.budget}</span>
                    : null}
                </label>
              </div>

              {/* 天数 */}
              <div className="home__search-field">
                <CalendarOutlined className="home__search-icon" aria-hidden="true" />
                <div className="home__search-label">
                  <span className="home__search-label-text">天数</span>
                  <div className="home__days-picker" aria-label="旅行天数">
                    <button type="button" onClick={() => setDays(Math.max(1, days - 1))} className="home__days-btn" aria-label="减少天数" disabled={days <= 1}>-</button>
                    <span className="home__days-value" aria-live="polite">{days}天</span>
                    <button type="button" onClick={() => setDays(Math.min(30, days + 1))} className="home__days-btn" aria-label="增加天数" disabled={days >= 30}>+</button>
                  </div>
                </div>
              </div>

              {/* 搜索按钮 */}
              <button type="submit" className="home__search-btn">
                <RobotOutlined aria-hidden="true" />
                <span>AI 规划</span>
              </button>
            </div>

            {/* 天气提示 */}
            {weather || weatherLoading
              ? (
                  <div className="home__search-weather" aria-live="polite">
                    {weatherLoading
                      ? <><span className="home__search-weather-spin" aria-hidden="true" /> 正在查询天气...</>
                      : weather
                        ? <><CloudOutlined aria-hidden="true" /> {weather.city} {weather.temperature}°C {weather.weatherDesc}</>
                        : null}
                  </div>
                )
              : null}
          </form>

          {/* 热门搜索标签 */}
          <div className="home__hot-tags">
            <span className="home__hot-tag-label"><FireOutlined aria-hidden="true" /> 热门：</span>
            {['三亚', '丽江', '西安', '成都', '大理', '厦门'].map(tag => (
              <button key={tag} type="button" className="home__hot-tag" onClick={() => selectCity(tag)}>{tag}</button>
            ))}
          </div>
        </div>
      </section>

      {/* 快捷入口 */}
      <section className="home__quick-section" aria-label="快捷服务">
        <div className="home__quick-grid">
          {quickEntries.map(entry => (
            <Link
              key={entry.label}
              to={entry.label === '天气查询' ? '/weather' : entry.label === 'AI 咨询' ? '/chat' : entry.label === 'AI 行程' ? '/detail' : '/'}
              className="home__quick-item"
            >
              <span className="home__quick-icon" style={{ background: entry.color }} aria-hidden="true">{entry.icon}</span>
              <span className="home__quick-label">{entry.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门目的地 */}
      <section className="home__section" aria-labelledby="hot-dest-title">
        <div className="home__section-head">
          <h2 id="hot-dest-title" className="home__section-title">
            <FireOutlined aria-hidden="true" /> 热门目的地
          </h2>
          <span className="home__section-more">查看更多 &gt;</span>
        </div>
        <div className="home__dest-grid">
          {hotDestinations.map(dest => (
            <button key={dest.name} type="button" className="home__dest-card" onClick={() => selectCity(dest.name)}>
              <div className="home__dest-img-wrap">
                <img src={dest.img} alt={dest.name} className="home__dest-img" loading="lazy" />
                <span className="home__dest-tag">{dest.tag}</span>
                <span className="home__dest-temp">{dest.temp}</span>
              </div>
              <div className="home__dest-info">
                <span className="home__dest-name">{dest.name}</span>
                <span className="home__dest-price">{dest.price}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 精选推荐 */}
      <section className="home__section" aria-labelledby="featured-title">
        <div className="home__section-head">
          <h2 id="featured-title" className="home__section-title">
            <StarOutlined aria-hidden="true" /> 精选推荐
          </h2>
          <span className="home__section-more">更多行程 &gt;</span>
        </div>
        <div className="home__featured-grid">
          {featuredTrips.map(trip => (
            <button key={trip.title} type="button" className="home__featured-card" onClick={() => selectCity(trip.city)}>
              <div className="home__featured-img-wrap">
                <img src={trip.image} alt={trip.title} className="home__featured-img" loading="lazy" />
                <span className="home__featured-tag">{trip.tag}</span>
              </div>
              <div className="home__featured-body">
                <h3 className="home__featured-title">{trip.title}</h3>
                <p className="home__featured-desc">{trip.desc}</p>
                <div className="home__featured-meta">
                  <span className="home__featured-rating">
                    <StarOutlined aria-hidden="true" />
                    {trip.rating}
                  </span>
                  <span className="home__featured-reviews">{trip.reviews} 条评价</span>
                </div>
                <div className="home__featured-price-row">
                  <span className="home__featured-price">¥{trip.price}</span>
                  <span className="home__featured-original">¥{trip.originalPrice}</span>
                  <span className="home__featured-discount">
                    {Math.round((1 - trip.price / trip.originalPrice) * 100)}
                    % OFF
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* AI 特色 + 用户评价 */}
      <section className="home__section home__ai-section" aria-labelledby="ai-feature-title">
        <div className="home__ai-grid">
          {/* AI 功能亮点 */}
          <div className="home__ai-card">
            <div className="home__ai-card-header">
              <ThunderboltOutlined className="home__ai-card-icon" aria-hidden="true" />
              <h3 id="ai-feature-title">为什么选择 AI 规划？</h3>
            </div>
            <ul className="home__ai-features">
              <li>
                <span className="home__ai-feature-dot" aria-hidden="true" />
                <span>实时天气 + 预算智能匹配</span>
              </li>
              <li>
                <span className="home__ai-feature-dot" aria-hidden="true" />
                <span>景点、酒店、交通一站式规划</span>
              </li>
              <li>
                <span className="home__ai-feature-dot" aria-hidden="true" />
                <span>支持 300+ 国内城市</span>
              </li>
              <li>
                <span className="home__ai-feature-dot" aria-hidden="true" />
                <span>行程可随时调整优化</span>
              </li>
            </ul>
            <div className="home__ai-stats">
              <div className="home__ai-stat">
                <span className="home__ai-stat-num">50,000+</span>
                <span className="home__ai-stat-label">行程已生成</span>
              </div>
              <div className="home__ai-stat">
                <span className="home__ai-stat-num">300+</span>
                <span className="home__ai-stat-label">覆盖城市</span>
              </div>
              <div className="home__ai-stat">
                <span className="home__ai-stat-num">98%</span>
                <span className="home__ai-stat-label">满意率</span>
              </div>
            </div>
          </div>

          {/* 用户评价 */}
          <div className="home__reviews-card">
            <h3 className="home__reviews-title"><TeamOutlined aria-hidden="true" /> 用户怎么说</h3>
            <div className="home__reviews-list">
              {userReviews.map(review => (
                <div key={review.name} className="home__review-item">
                  <div className="home__review-header">
                    <span className="home__review-avatar">{review.avatar}</span>
                    <div>
                      <span className="home__review-name">{review.name}</span>
                      <span className="home__review-dest">去了 {review.dest}</span>
                    </div>
                    <span className="home__review-stars" aria-label={`${review.rating} 星`}>
                      {'★'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="home__review-text">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="home__cta" aria-label="立即开始">
        <div className="home__cta-inner">
          <h2 className="home__cta-title">准备好出发了吗？</h2>
          <p className="home__cta-subtitle">让 AI 为你量身定制下一段旅程</p>
          <button type="button" className="home__cta-btn" onClick={onStart}>
            <RobotOutlined aria-hidden="true" />
            {user ? '立即规划行程' : '登录开始规划'}
          </button>
        </div>
      </section>
    </main>
  )
}
