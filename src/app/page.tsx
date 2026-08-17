'use client'

/**
 * 首页（行程推荐）
 * OTA 旅行平台风格的落地页，包含搜索表单、热门目的地、精选推荐、AI 特色介绍等模块。
 */
import { Bot, Cloud, Compass, Flame, MapPin, Star, Users, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { HeroSearch } from '@/components/home/HeroSearch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAppToast } from '@/hooks/useAppToast'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useAuthStore } from '@/stores/auth'

import { featuredTrips, hotDestinations, userReviews } from './home-data'

const quickEntries = [
  {
    desc: '告诉我目的地和预算，AI 实时生成专属行程',
    href: '/detail',
    icon: <Compass size={32} />,
    image: '/images/home/hero-boat.jpg',
    label: 'AI 行程规划',
    span: 'col-span-2 row-span-2',
    style: 'image' as const,
  },
  {
    bgColor: 'bg-[#1a1a2e]',
    desc: '发现身边好去处',
    href: '/attractions',
    icon: <MapPin size={20} />,
    label: '精选景点',
    span: 'col-span-1 row-span-1',
    style: 'dark' as const,
  },
  {
    bgColor: 'bg-[#f5f0eb]',
    desc: '旅友分享攻略',
    href: '/community',
    icon: <Users size={20} />,
    label: '旅友社区',
    span: 'col-span-1 row-span-1',
    style: 'light' as const,
  },
  {
    bgColor: 'bg-[#e8f4f8]',
    desc: '实时天气预报',
    href: '/weather',
    icon: <Cloud size={20} />,
    label: '天气查询',
    span: 'col-span-1 row-span-1',
    style: 'cool' as const,
  },
  {
    bgColor: 'bg-[#2d2d2d]',
    desc: '24h 旅行顾问',
    href: '/chat',
    icon: <Bot size={20} />,
    label: 'AI 咨询',
    span: 'col-span-1 row-span-1',
    style: 'dark' as const,
  },
]

export default function HomePage() {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  useScrollReveal()

  const onStart = () => {
    if (!hasHydrated) {
      toast.info('加载中...')
      return
    }
    if (!user)
      return router.push('/login')
    router.push('/detail')
  }

  return (
    <main className="min-h-[100dvh] overflow-x-hidden bg-background text-travel-ink">
      {/* Hero 搜索区 */}
      <HeroSearch />

      {/* Bento Grid 功能区 */}
      <section aria-label="快捷服务" className="relative mx-auto max-w-[1200px] px-6 py-16">
        <div className="mb-10 text-center scroll-reveal">
          <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">探索旅行的无限可能</h2>
          <p className="mt-2 text-gray-500">AI 帮你规划行程，发现精彩目的地</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
          {quickEntries.map((entry, index) => (
            <Link
              className={`group relative overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl scroll-reveal ${entry.span} ${
                entry.style === 'image' ? '' : entry.bgColor
              }`}
              data-delay={index}
              href={entry.href}
              key={entry.label}
            >
              {entry.style === 'image'
                ? (
                    <>
                      <Image
                        alt=""
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        fill
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        src={entry.image}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-0 p-6 flex flex-col justify-end">
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm text-white">
                          {entry.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{entry.label}</h3>
                        <p className="text-sm text-white/70">{entry.desc}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-white/50 transition-all group-hover:text-white/80 group-hover:gap-2">
                          开始规划
                          {' '}
                          <span>&rarr;</span>
                        </div>
                      </div>
                    </>
                  )
                : entry.style === 'dark'
                  ? (
                      <div className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-white/80">
                            {entry.icon}
                          </div>
                          <h3 className="text-lg font-bold text-white mb-1">{entry.label}</h3>
                          <p className="text-xs text-white/50">{entry.desc}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-white/40 transition-all group-hover:text-white/70 group-hover:gap-2">
                          了解更多
                          {' '}
                          <span>&rarr;</span>
                        </div>
                      </div>
                    )
                  : (
                      <div className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-900/5 text-gray-700">
                            {entry.icon}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-1">{entry.label}</h3>
                          <p className="text-xs text-gray-500">{entry.desc}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 transition-all group-hover:text-gray-700 group-hover:gap-2">
                          了解更多
                          {' '}
                          <span>&rarr;</span>
                        </div>
                      </div>
                    )}
            </Link>
          ))}
        </div>
      </section>

      {/* 热门目的地 */}
      <section aria-labelledby="hot-dest-title" className="relative mx-auto max-w-[1200px] px-6 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="mb-8 flex items-center justify-between scroll-reveal">
          <h2
            className="flex items-center gap-3 text-2xl font-bold"
            id="hot-dest-title"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg">
              <Flame aria-hidden="true" size={20} />
            </span>
            <span className="bg-gradient-to-r from-travel-ink to-travel-ink/70 bg-clip-text text-transparent">
              热门目的地
            </span>
          </h2>
          <Link
            className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
            href="/attractions"
          >
            查看更多
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {hotDestinations.map((dest, index) => (
            <Link
              className="group block overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:ring-2 hover:ring-teal-200 scroll-reveal"
              data-delay={index}
              href={`/detail?city=${encodeURIComponent(dest.name)}`}
              key={dest.name}
            >
              <div className="relative h-[220px] w-full overflow-hidden">
                <Image
                  alt={dest.name}
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={dest.img}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Badge className="absolute left-3 top-3 bg-white/90 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
                  {dest.tag}
                </Badge>
                <Badge className="absolute bottom-3 right-3 border-0 bg-black/60 text-xs font-medium text-white backdrop-blur-sm" variant="outline">
                  {dest.temp}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-lg font-bold text-travel-ink">{dest.name}</span>
                <span className="text-lg font-bold text-primary">{dest.price}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 精选推荐 */}
      <section aria-labelledby="featured-title" className="relative mx-auto max-w-[1200px] px-6 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-secondary/20 to-transparent" />
        </div>

        <div className="mb-8 flex items-center justify-between scroll-reveal">
          <h2
            className="flex items-center gap-3 text-2xl font-bold"
            id="featured-title"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white shadow-lg">
              <Star aria-hidden="true" size={20} />
            </span>
            <span className="bg-gradient-to-r from-travel-ink to-travel-ink/70 bg-clip-text text-transparent">
              精选推荐
            </span>
          </h2>
          <Link
            className="group flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-strong"
            href="/detail"
          >
            更多行程
            <span className="transition-transform group-hover:translate-x-1">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredTrips.map((trip, index) => (
            <Link
              className="group block overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-2 hover:ring-2 hover:ring-cyan-200 scroll-reveal"
              data-delay={index}
              href={`/detail?city=${encodeURIComponent(trip.city)}`}
              key={trip.title}
            >
              <div className="relative h-[200px] w-full overflow-hidden">
                <Image
                  alt={trip.title}
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  src={trip.image}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <Badge className="absolute left-3 top-3 bg-white/90 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
                  {trip.tag}
                </Badge>
              </div>
              <div className="p-5">
                <h3 className="mb-2 text-lg font-bold text-travel-ink transition-colors group-hover:text-primary">
                  {trip.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-travel-muted">{trip.desc}</p>
                <div className="mb-4 flex items-center gap-2">
                  <Badge className="gap-1 border-0 bg-cyan-50 text-sm font-semibold text-cyan-600">
                    <Star aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
                    {trip.rating}
                  </Badge>
                  <span className="text-sm text-travel-muted">
                    {trip.reviews}
                    {' '}
                    条评价
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-primary">
                    ¥
                    {trip.price}
                  </span>
                  <span className="text-sm text-travel-muted line-through">
                    ¥
                    {trip.originalPrice}
                  </span>
                  <Badge className="ml-auto border-0 bg-gradient-to-r from-red-500 to-pink-500 text-xs font-bold text-white shadow-sm">
                    {Math.round((1 - trip.price / trip.originalPrice) * 100)}
                    % OFF
                  </Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* AI 特色 + 用户评价 */}
      <section aria-labelledby="ai-feature-title" className="relative mx-auto max-w-[1200px] px-6 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8 text-white scroll-reveal-left">
            {/* 装饰元素 */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-3xl" />

            <div className="relative mb-8 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 shadow-lg">
                <Zap aria-hidden="true" size={24} />
              </span>
              <h3 className="text-2xl font-bold" id="ai-feature-title">
                为什么选择 AI 规划？
              </h3>
            </div>
            <ul className="relative mb-10 space-y-5">
              {[
                '实时天气 + 预算智能匹配',
                '景点、酒店、交通一站式规划',
                '支持 300+ 国内城市',
                '行程可随时调整优化',
              ].map((text, index) => (
                <li className="flex items-center gap-4" key={text}>
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-sm font-bold text-cyan-400 backdrop-blur-sm">
                    {index + 1}
                  </span>
                  <span className="text-base">{text}</span>
                </li>
              ))}
            </ul>
            <div className="relative grid grid-cols-3 gap-6 rounded-2xl bg-white/5 p-6 backdrop-blur-sm">
              {[
                { label: '行程已生成', num: '50,000+' },
                { label: '覆盖城市', num: '300+' },
                { label: '满意率', num: '98%' },
              ].map(stat => (
                <div className="text-center" key={stat.label}>
                  <span className="block text-3xl font-bold text-cyan-400">{stat.num}</span>
                  <span className="mt-1 block text-sm text-slate-400">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-lg scroll-reveal-right">
            <h3 className="mb-8 flex items-center gap-3 text-xl font-bold text-travel-ink">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                <Users aria-hidden="true" className="text-primary" size={20} />
              </span>
              用户怎么说
            </h3>
            <div className="space-y-6">
              {userReviews.map((review, index) => (
                <div
                  className="rounded-2xl border border-travel-border/50 p-4 transition-all duration-300 hover:border-primary/20 hover:shadow-sm animate-fade-in-up"
                  key={review.name}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-xl">
                        {review.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="block font-semibold text-travel-ink">{review.name}</span>
                      <span className="text-sm text-travel-muted">
                        去了
                        {review.dest}
                      </span>
                    </div>
                    <span aria-label={`${review.rating} 星`} className="ml-auto flex items-center gap-0.5 text-cyan-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star className="h-4 w-4 fill-current" key={i} />
                      ))}
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
      <section aria-label="立即开始" className="relative overflow-hidden bg-teal-500 py-20">
        {/* 装饰元素 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2230%22%20height%3D%2230%22%20viewBox%3D%220%200%2030%2030%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Ccircle%20cx%3D%2215%22%20cy%3D%2215%22%20r%3D%221%22%20fill%3D%22rgba(255%2C255%2C255%2C0.1)%22%2F%3E%3C%2Fsvg%3E')] opacity-50" />
        </div>

        <div className="relative mx-auto max-w-[1200px] px-6 text-center scroll-reveal-scale">
          <h2 className="mb-4 text-4xl font-bold text-white drop-shadow-lg">
            准备好出发了吗？
          </h2>
          <p className="mb-10 text-lg text-white/90">
            让 AI 为你量身定制下一段旅程
          </p>
          <Button
            className="group gap-3 rounded-full bg-white px-10 py-5 text-lg font-bold text-primary shadow-2xl hover:-translate-y-1 hover:scale-105 hover:shadow-3xl"
            onClick={onStart}
            size="lg"
          >
            <Compass aria-hidden="true" className="transition-transform duration-300 group-hover:rotate-45" />
            {user ? '立即规划行程' : '登录开始规划'}
          </Button>
        </div>
      </section>
    </main>
  )
}
