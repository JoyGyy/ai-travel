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
    <main className="min-h-[100dvh] overflow-x-hidden bg-background text-travel-ink">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-[100] border-b border-[var(--travel-frosted-border)] bg-white/88 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-[12px]">
        <div className="mx-auto flex min-h-[56px] max-w-[1200px] items-center gap-6 px-6">
          <Link aria-label="返回首页" className="inline-flex flex-shrink-0 items-center gap-2 no-underline" href="/">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-lg text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)]">
              <Compass />
            </span>
            <span className="text-[17px] font-black tracking-tight text-travel-ink">TravelAI</span>
          </Link>
          <nav aria-label="主导航" className="flex items-center gap-1">
            <NavLink href="/">首页</NavLink>
            <NavLink href="/weather">天气</NavLink>
            <NavLink href="/attractions">景点</NavLink>
            <NavLink href="/community">社区</NavLink>
            <NavLink href="/chat">AI 咨询</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            {user ? (
              <Link className="inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3.5 py-1.5 text-[13px] font-bold text-primary no-underline" href="/profile">
                <User /> {user.username || '用户'}
              </Link>
            ) : (
              <Link className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[13px] font-bold text-white no-underline shadow-[0_2px_8px_rgba(255,107,53,0.3)] transition-all hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_4px_14px_rgba(255,107,53,0.4)]" href="/login">
                <LogIn /> 登录 / 注册
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero 搜索区 */}
      <HeroSearch />

      {/* 快捷入口 */}
      <section aria-label="快捷服务" className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
          {quickEntries.map((entry) => (
            <Link
              className="flex flex-col items-center gap-3 rounded-xl p-4 transition-all hover:bg-travel-surface hover:shadow-md"
              href={entry.href}
              key={entry.label}
            >
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white"
                style={{ background: entry.color }}
              >
                {entry.icon}
              </span>
              <span className="text-sm font-medium text-travel-ink">{entry.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 热门目的地 */}
      <section aria-labelledby="hot-dest-title" className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-travel-ink" id="hot-dest-title">
            <Flame aria-hidden="true" className="text-primary" /> 热门目的地
          </h2>
          <span className="text-sm text-primary">查看更多 &gt;</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {hotDestinations.map((dest) => (
            <Link
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md"
              href={`/detail?city=${encodeURIComponent(dest.name)}`}
              key={dest.name}
            >
              <div className="relative overflow-hidden">
                <Image
                  alt={dest.name}
                  className="h-[200px] w-full object-cover transition-transform group-hover:scale-105"
                  height={200}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={dest.img}
                  width={300}
                />
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-bold text-white">
                  {dest.tag}
                </span>
                <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
                  {dest.temp}
                </span>
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="font-semibold text-travel-ink">{dest.name}</span>
                <span className="text-sm font-bold text-primary">{dest.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 精选推荐 */}
      <section aria-labelledby="featured-title" className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold text-travel-ink" id="featured-title">
            <Star aria-hidden="true" className="text-yellow-500" /> 精选推荐
          </h2>
          <span className="text-sm text-primary">更多行程 &gt;</span>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTrips.map((trip) => (
            <Link
              className="group overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-md"
              href={`/detail?city=${encodeURIComponent(trip.city)}`}
              key={trip.title}
            >
              <div className="relative overflow-hidden">
                <Image
                  alt={trip.title}
                  className="h-[200px] w-full object-cover transition-transform group-hover:scale-105"
                  height={200}
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={trip.image}
                  width={300}
                />
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-1 text-xs font-bold text-white">
                  {trip.tag}
                </span>
              </div>
              <div className="p-4">
                <h3 className="mb-2 text-lg font-bold text-travel-ink">{trip.title}</h3>
                <p className="mb-3 text-sm text-travel-muted">{trip.desc}</p>
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-yellow-500">
                    <Star aria-hidden="true" className="h-4 w-4 fill-current" />
                    {trip.rating}
                  </span>
                  <span className="text-sm text-travel-muted">{trip.reviews} 条评价</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">¥{trip.price}</span>
                  <span className="text-sm text-travel-muted line-through">¥{trip.originalPrice}</span>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                    {Math.round((1 - trip.price / trip.originalPrice) * 100)}% OFF
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 特色 + 用户评价 */}
      <section aria-labelledby="ai-feature-title" className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 text-white">
            <div className="mb-6 flex items-center gap-3">
              <Zap aria-hidden="true" className="h-8 w-8 text-yellow-400" />
              <h3 className="text-2xl font-bold" id="ai-feature-title">为什么选择 AI 规划？</h3>
            </div>
            <ul className="mb-8 space-y-4">
              {[
                '实时天气 + 预算智能匹配',
                '景点、酒店、交通一站式规划',
                '支持 300+ 国内城市',
                '行程可随时调整优化',
              ].map((text) => (
                <li className="flex items-center gap-3" key={text}>
                  <span aria-hidden="true" className="h-2 w-2 rounded-full bg-yellow-400" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '行程已生成', num: '50,000+' },
                { label: '覆盖城市', num: '300+' },
                { label: '满意率', num: '98%' },
              ].map((stat) => (
                <div className="text-center" key={stat.label}>
                  <span className="block text-2xl font-bold text-yellow-400">{stat.num}</span>
                  <span className="text-sm text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h3 className="mb-6 flex items-center gap-2 text-xl font-bold text-travel-ink">
              <Users aria-hidden="true" /> 用户怎么说
            </h3>
            <div className="space-y-6">
              {userReviews.map((review) => (
                <div className="border-b border-travel-border pb-6 last:border-0 last:pb-0" key={review.name}>
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg">
                      {review.avatar}
                    </span>
                    <div>
                      <span className="block font-semibold text-travel-ink">{review.name}</span>
                      <span className="text-sm text-travel-muted">去了{review.dest}</span>
                    </div>
                    <span aria-label={`${review.rating} 星`} className="ml-auto text-yellow-500">
                      {'★'.repeat(review.rating)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-travel-muted">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section aria-label="立即开始" className="bg-gradient-to-r from-primary to-orange-600 py-16">
        <div className="mx-auto max-w-[1200px] px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white">准备好出发了吗？</h2>
          <p className="mb-8 text-lg text-white/80">让 AI 为你量身定制下一段旅程</p>
          <button
            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-primary shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
            onClick={onStart}
            type="button"
          >
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
      className={`inline-flex min-h-[40px] items-center rounded-lg px-3.5 text-sm font-semibold no-underline transition-colors ${
        isActive
          ? 'bg-primary/6 font-bold text-primary'
          : 'text-travel-ink/65 hover:bg-primary/6 hover:text-primary'
      }`}
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
