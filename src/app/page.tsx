'use client'

/**
 * 首页（行程推荐）
 * OTA 旅行平台风格的落地页，包含搜索表单、热门目的地、精选推荐、AI 特色介绍等模块。
 */
import { Bot, Cloud, Compass, MapPin, Star, Users, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { userReviews } from '@/app/home-data'
import { ComplianceFooter } from '@/components/ComplianceFooter'
import { FeaturedTripsSection } from '@/components/home/FeaturedTripsSection'
import { HeroSearch } from '@/components/home/HeroSearch'
import { HotDestinationsSection } from '@/components/home/HotDestinationsSection'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAppToast } from '@/hooks/useAppToast'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useAuthStore } from '@/stores/auth'

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
    bgColor: 'bg-travel-ocean',
    desc: '发现身边好去处',
    href: '/attractions',
    icon: <MapPin size={20} />,
    label: '精选景点',
    span: 'col-span-1 row-span-1',
    style: 'dark' as const,
  },
  {
    bgColor: 'bg-travel-surface-muted',
    desc: '旅友分享攻略',
    href: '/community',
    icon: <Users size={20} />,
    label: '旅友社区',
    span: 'col-span-1 row-span-1',
    style: 'light' as const,
  },
  {
    bgColor: 'bg-primary/8',
    desc: '实时天气预报',
    href: '/weather',
    icon: <Cloud size={20} />,
    label: '天气查询',
    span: 'col-span-1 row-span-1',
    style: 'cool' as const,
  },
  {
    bgColor: 'bg-travel-slate',
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
    router.push('/chat')
  }

  return (
    <main className="home-editorial min-h-dvh overflow-x-hidden bg-background text-travel-ink">
      {/* Hero 搜索区 */}
      <HeroSearch />

      {/* Bento Grid 功能区 */}
      <section className="relative mx-auto max-w-[1200px] px-6 py-16">
        <div className="mb-10 text-center scroll-reveal">
          <h2 className="text-2xl font-bold text-travel-ink md:text-3xl">探索旅行的无限可能</h2>
          <p className="mt-2 text-travel-muted">AI 帮你规划行程，发现精彩目的地</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
          {quickEntries.map((entry, index) => (
            <Link
              className={`group relative overflow-hidden rounded-lg transition-all duration-200 hover:shadow-xl scroll-reveal ${entry.span} ${
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
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/15 text-white">
                          {entry.icon}
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-1">{entry.label}</h3>
                        <p className="text-sm text-white/70">{entry.desc}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-medium text-white/50 transition-all group-hover:text-white/80 group-hover:gap-2">
                          开始规划
                          {' '}
                          <span aria-hidden="true">&rarr;</span>
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
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </div>
                    )
                  : (
                      <div className="p-5 flex flex-col justify-between h-full">
                        <div>
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-travel-ink/6 text-travel-ocean">
                            {entry.icon}
                          </div>
                          <h3 className="text-lg font-bold text-travel-ink mb-1">{entry.label}</h3>
                          <p className="text-xs text-travel-muted">{entry.desc}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-medium text-travel-muted transition-all group-hover:text-travel-ocean group-hover:gap-2">
                          了解更多
                          {' '}
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </div>
                    )}
            </Link>
          ))}
        </div>
      </section>

      {/* 热门目的地 */}
      <HotDestinationsSection />

      {/* 精选推荐 */}
      <FeaturedTripsSection />

      {/* AI 特色 + 用户评价 */}
      <section className="relative mx-auto max-w-[1200px] px-6 py-12">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-lg bg-stone-900 p-8 text-white scroll-reveal-left">

            <div className="relative mb-8 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Zap size={24} />
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
            <div className="relative grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                { label: '实时生成', num: '流式' },
                { label: '回答依据', num: '可追溯' },
                { label: '行程调整', num: '可编辑' },
              ].map(stat => (
                <div className="text-center" key={stat.label}>
                  <span className="block text-lg font-bold text-white">{stat.num}</span>
                  <span className="mt-1 block text-sm text-white/62">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-travel-ink/10 bg-white p-8 scroll-reveal-right">
            <h3 className="mb-8 flex items-center gap-3 text-xl font-bold text-travel-ink">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Users className="text-primary" size={20} />
              </span>
              用户怎么说
            </h3>
            <div className="space-y-6">
              {userReviews.map((review, index) => (
                <div
                  className="border-b border-travel-ink/10 pb-5 last:border-b-0 last:pb-0 animate-fade-in-up"
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
                    <span className="ml-auto flex items-center gap-0.5 text-cyan-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
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
      <section className="relative overflow-hidden bg-primary py-20">
        <div className="relative mx-auto max-w-[1200px] px-6 text-center scroll-reveal-scale">
          <h2 className="mb-4 text-4xl font-bold text-white">
            准备好出发了吗？
          </h2>
          <p className="mb-10 text-lg text-white/90">
            让 AI 为你量身定制下一段旅程
          </p>
          <Button
            className="group gap-3 rounded-lg bg-white px-10 py-5 text-lg font-bold text-primary shadow-lg hover:bg-stone-100"
            onClick={onStart}
            size="lg"
          >
            <Compass />
            {user ? '立即规划行程' : '登录开始规划'}
          </Button>
        </div>
      </section>
      <ComplianceFooter />
    </main>
  )
}
