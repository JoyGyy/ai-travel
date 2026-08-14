'use client'

/**
 * 首页（行程推荐）
 * OTA 旅行平台风格的落地页，包含搜索表单、热门目的地、精选推荐、AI 特色介绍等模块。
 */
import {
  Bot,
  Cloud,
  Compass,
  Flame,
  Home,
  LogIn,
  MapPin,
  Star,
  User,
  Users,
  Zap,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

import { HeroSearch } from '@/components/home/HeroSearch'
import { useAppToast } from '@/hooks/useAppToast'
import { useAuthStore } from '@/stores/auth'

import { featuredTrips, hotDestinations, userReviews } from './home-data'
import './style.css'

const quickEntries = [
  { color: '#FF6B35', href: '/', icon: <Home />, label: '酒店民宿' },
  { color: '#F59E0B', href: '/detail', icon: <Compass />, label: 'AI 行程' },
  { color: '#10B981', href: '/attractions', icon: <MapPin />, label: '精选景点' },
  { color: '#8B5CF6', href: '/community', icon: <Users />, label: '旅友社区' },
  { color: '#3B82F6', href: '/weather', icon: <Cloud />, label: '天气查询' },
  { color: '#E84057', href: '/chat', icon: <Bot />, label: 'AI 咨询' },
]

export default function HomePage() {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state._hasHydrated)

  const onStart = () => {
    if (!hasHydrated) {
      toast.info('加载中...')
      return
    }
    if (!user) return router.push('/login')
    router.push('/detail')
  }

  return (
    <main className="home">
      {/* 顶部导航 */}
      <header className="home__header">
        <div className="home__header-inner">
          <Link aria-label="返回首页" className="home__brand" href="/">
            <span className="home__brand-icon">
              <Compass />
            </span>
            <span className="home__brand-name">TravelAI</span>
          </Link>
          <nav aria-label="主导航" className="home__nav">
            <NavLink href="/">首页</NavLink>
            <NavLink href="/weather">天气</NavLink>
            <NavLink href="/attractions">景点</NavLink>
            <NavLink href="/community">社区</NavLink>
            <NavLink href="/chat">AI 咨询</NavLink>
          </nav>
          <div className="home__header-right">
            {user ? (
              <Link className="home__user-badge" href="/profile">
                <User /> {user.username || '用户'}
              </Link>
            ) : (
              <Link className="home__login-btn" href="/login">
                <LogIn /> 登录 / 注册
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero 搜索区 */}
      <HeroSearch />

      {/* 快捷入口 */}
      <section aria-label="快捷服务" className="home__quick-section">
        <div className="home__quick-grid">
          {quickEntries.map((entry) => (
            <Link className="home__quick-item" href={entry.href} key={entry.label}>
              <span
                aria-hidden="true"
                className="home__quick-icon"
                style={{ background: entry.color }}
              >
                {entry.icon}
              </span>
              <span className="home__quick-label">{entry.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门目的地 */}
      <section aria-labelledby="hot-dest-title" className="home__section">
        <div className="home__section-head">
          <h2 className="home__section-title" id="hot-dest-title">
            <Flame aria-hidden="true" /> 热门目的地
          </h2>
          <span className="home__section-more">查看更多 &gt;</span>
        </div>
        <div className="home__dest-grid">
          {hotDestinations.map((dest) => (
            <Link
              className="home__dest-card"
              href={`/detail?city=${encodeURIComponent(dest.name)}`}
              key={dest.name}
            >
              <div className="home__dest-img-wrap">
                <Image
                  alt={dest.name}
                  className="home__dest-img"
                  height={200}
                  loading="lazy"
                  src={dest.img}
                  width={300}
                />
                <span className="home__dest-tag">{dest.tag}</span>
                <span className="home__dest-temp">{dest.temp}</span>
              </div>
              <div className="home__dest-info">
                <span className="home__dest-name">{dest.name}</span>
                <span className="home__dest-price">{dest.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 精选推荐 */}
      <section aria-labelledby="featured-title" className="home__section">
        <div className="home__section-head">
          <h2 className="home__section-title" id="featured-title">
            <Star aria-hidden="true" /> 精选推荐
          </h2>
          <span className="home__section-more">更多行程 &gt;</span>
        </div>
        <div className="home__featured-grid">
          {featuredTrips.map((trip) => (
            <Link
              className="home__featured-card"
              href={`/detail?city=${encodeURIComponent(trip.city)}`}
              key={trip.title}
            >
              <div className="home__featured-img-wrap">
                <Image
                  alt={trip.title}
                  className="home__featured-img"
                  height={200}
                  loading="lazy"
                  src={trip.image}
                  width={300}
                />
                <span className="home__featured-tag">{trip.tag}</span>
              </div>
              <div className="home__featured-body">
                <h3 className="home__featured-title">{trip.title}</h3>
                <p className="home__featured-desc">{trip.desc}</p>
                <div className="home__featured-meta">
                  <span className="home__featured-rating">
                    <Star aria-hidden="true" />
                    {trip.rating}
                  </span>
                  <span className="home__featured-reviews">{trip.reviews} 条评价</span>
                </div>
                <div className="home__featured-price-row">
                  <span className="home__featured-price">¥{trip.price}</span>
                  <span className="home__featured-original">¥{trip.originalPrice}</span>
                  <span className="home__featured-discount">
                    {Math.round((1 - trip.price / trip.originalPrice) * 100)}% OFF
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 特色 + 用户评价 */}
      <section aria-labelledby="ai-feature-title" className="home__section home__ai-section">
        <div className="home__ai-grid">
          <div className="home__ai-card">
            <div className="home__ai-card-header">
              <Zap aria-hidden="true" className="home__ai-card-icon" />
              <h3 id="ai-feature-title">为什么选择 AI 规划？</h3>
            </div>
            <ul className="home__ai-features">
              {[
                '实时天气 + 预算智能匹配',
                '景点、酒店、交通一站式规划',
                '支持 300+ 国内城市',
                '行程可随时调整优化',
              ].map((text) => (
                <li key={text}>
                  <span aria-hidden="true" className="home__ai-feature-dot" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="home__ai-stats">
              {[
                { label: '行程已生成', num: '50,000+' },
                { label: '覆盖城市', num: '300+' },
                { label: '满意率', num: '98%' },
              ].map((stat) => (
                <div className="home__ai-stat" key={stat.label}>
                  <span className="home__ai-stat-num">{stat.num}</span>
                  <span className="home__ai-stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="home__reviews-card">
            <h3 className="home__reviews-title">
              <Users aria-hidden="true" /> 用户怎么说
            </h3>
            <div className="home__reviews-list">
              {userReviews.map((review) => (
                <div className="home__review-item" key={review.name}>
                  <div className="home__review-header">
                    <span className="home__review-avatar">{review.avatar}</span>
                    <div>
                      <span className="home__review-name">{review.name}</span>
                      <span className="home__review-dest">
                        去了
                        {review.dest}
                      </span>
                    </div>
                    <span aria-label={`${review.rating} 星`} className="home__review-stars">
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
      <section aria-label="立即开始" className="home__cta">
        <div className="home__cta-inner">
          <h2 className="home__cta-title">准备好出发了吗？</h2>
          <p className="home__cta-subtitle">让 AI 为你量身定制下一段旅程</p>
          <button className="home__cta-btn" onClick={onStart} type="button">
            <Compass aria-hidden="true" />
            {user ? '立即规划行程' : '登录开始规划'}
          </button>
        </div>
      </section>
    </main>
  )
}

function NavLink({ children, href }: { children: React.ReactNode; href: string }) {
  const isActive = useIsActive(href)
  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={`home__nav-link ${isActive ? 'home__nav-link--active' : ''}`}
      href={href}
    >
      {children}
    </Link>
  )
}

/** NavLink 替代：根据当前路径判断是否激活 */
function useIsActive(href: string) {
  const pathname = usePathname()
  if (href === '/') return pathname === '/'
  return pathname?.startsWith(href) ?? false
}
