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
    desc: '告诉我目的地和预算，AI 实时生成专属旅行手账',
    href: '/detail',
    icon: <Compass size={32} />,
    image: '/images/home/hero-boat.jpg',
    label: 'AI 行程规划',
    span: 'col-span-2 row-span-2',
    style: 'image' as const,
  },
  {
    bgColor: 'bg-emerald-800',
    desc: '发现身边宝藏去处',
    href: '/attractions',
    icon: <MapPin size={20} />,
    label: '精选景点',
    span: 'col-span-1 row-span-1',
    style: 'dark' as const,
  },
  {
    bgColor: 'bg-[#F4EFE6] border border-stone-200/80',
    desc: '旅友真实游记手账',
    href: '/community',
    icon: <Users size={20} />,
    label: '旅人社区',
    span: 'col-span-1 row-span-1',
    style: 'light' as const,
  },
  {
    bgColor: 'bg-amber-50/80 border border-amber-200/70',
    desc: '当地实时天气感知',
    href: '/weather',
    icon: <Cloud size={20} />,
    label: '出行天气',
    span: 'col-span-1 row-span-1',
    style: 'light' as const,
  },
  {
    bgColor: 'bg-stone-800',
    desc: '24h 智能旅伴顾问',
    href: '/chat',
    icon: <Bot size={20} />,
    label: 'AI 对话',
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
    <main className="home-editorial min-h-dvh overflow-x-hidden bg-[#FAF7F0] text-stone-900">
      {/* Hero 搜索区 */}
      <HeroSearch />

      {/* Bento Grid 功能区 */}
      <section className="relative mx-auto max-w-[1200px] px-6 py-16">
        <div className="mb-10 text-center scroll-reveal">
          <span className="font-serif italic text-amber-800 text-xs tracking-widest block mb-1">
            — DISCOVER & TRAVEL —
          </span>
          <h2 className="font-serif text-2xl font-extrabold text-stone-900 md:text-3xl">探索旅行的无限可能</h2>
          <p className="mt-2 text-sm text-stone-600">AI 帮你规划灵感路线，生成专属视觉手账</p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:grid-rows-2">
          {quickEntries.map((entry, index) => (
            <Link
              className={`group relative overflow-hidden rounded-3xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 scroll-reveal ${entry.span} ${
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
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/30 to-transparent" />
                      <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white shadow-md">
                          {entry.icon}
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-white mb-1">{entry.label}</h3>
                        <p className="text-xs sm:text-sm text-stone-200">{entry.desc}</p>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-amber-300 transition-all group-hover:gap-2.5">
                          开启手账定制
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </div>
                    </>
                  )
                : entry.style === 'dark'
                  ? (
                      <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white shadow-sm">
                            {entry.icon}
                          </div>
                          <h3 className="font-serif text-lg font-bold text-white mb-1">{entry.label}</h3>
                          <p className="text-xs text-stone-300">{entry.desc}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-stone-300 transition-all group-hover:text-white group-hover:gap-2">
                          探索更多
                          <span aria-hidden="true">&rarr;</span>
                        </div>
                      </div>
                    )
                  : (
                      <div className="p-6 flex flex-col justify-between h-full">
                        <div>
                          <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700/10 text-emerald-800 shadow-2xs">
                            {entry.icon}
                          </div>
                          <h3 className="font-serif text-lg font-bold text-stone-900 mb-1">{entry.label}</h3>
                          <p className="text-xs text-stone-600">{entry.desc}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-800 transition-all group-hover:text-emerald-900 group-hover:gap-2">
                          探索更多
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
      <section className="relative mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* 左侧 AI 优势卡片 */}
          <div className="relative overflow-hidden rounded-3xl bg-emerald-900 p-8 text-white shadow-lg border border-emerald-700/40 scroll-reveal-left">
            <div className="relative mb-8 flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-stone-900 shadow-md">
                <Zap size={24} className="fill-stone-900" />
              </span>
              <div>
                <span className="text-xs uppercase font-bold text-emerald-300 tracking-wider">AI SUPERPOWER</span>
                <h3 className="font-serif text-2xl font-bold" id="ai-feature-title">
                  为什么选择 AI 旅行规划？
                </h3>
              </div>
            </div>
            <ul className="relative mb-10 space-y-4">
              {[
                '实时气象 + 预算智能匹配与权衡',
                '景点、酒店、交通与路线一站式推演',
                '覆盖国内 300+ 热门城市深度路书',
                '行程随时随心调整，全流程可回溯',
              ].map((text, index) => (
                <li className="flex items-center gap-3.5" key={text}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white/15 text-xs font-bold text-amber-300 backdrop-blur-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm sm:text-base text-stone-100">{text}</span>
                </li>
              ))}
            </ul>
            <div className="relative grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                { label: '实时生成', num: '秒级流式' },
                { label: '回答依据', num: '100%可溯' },
                { label: '行程调整', num: '手账卡片' },
              ].map(stat => (
                <div className="text-center" key={stat.label}>
                  <span className="block text-base font-bold text-amber-300">{stat.num}</span>
                  <span className="mt-1 block text-xs text-stone-300">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧 用户评价 */}
          <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-8 shadow-sm scroll-reveal-right">
            <h3 className="mb-6 flex items-center gap-3 font-serif text-xl font-bold text-stone-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <Users size={18} />
              </span>
              旅人原声手账
            </h3>
            <div className="space-y-5">
              {userReviews.map((review, index) => (
                <div
                  className="border-b border-stone-200/80 pb-4.5 last:border-b-0 last:pb-0"
                  key={review.name}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-2.5 flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-stone-200">
                      <AvatarFallback className="bg-emerald-100 text-emerald-800 font-bold text-sm">
                        {review.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="block text-sm font-bold text-stone-900">{review.name}</span>
                      <span className="text-xs text-stone-500">
                        去过 ·
                        {' '}
                        {review.dest}
                      </span>
                    </div>
                    <span className="ml-auto flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <Star className="h-3.5 w-3.5 fill-current" key={i} />
                      ))}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-stone-600">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="relative w-full overflow-hidden bg-emerald-900 py-16 md:py-20 text-white">
        <div className="relative mx-auto max-w-[1200px] px-6 text-center scroll-reveal-scale">
          <span className="font-serif italic text-amber-300 text-sm tracking-widest block mb-2">
            — START YOUR JOURNEY —
          </span>
          <h2 className="mb-3 font-serif text-3xl md:text-4xl font-extrabold text-white">
            准备好开启下一段山海之旅了吗？
          </h2>
          <p className="mb-8 text-sm md:text-base text-emerald-100 max-w-lg mx-auto">
            告诉我目的地与预算，AI 顾问立即为你手绘专属路书
          </p>
          <Button
            className="group gap-2.5 rounded-2xl bg-white px-8 py-5 text-base font-bold text-emerald-900 shadow-xl hover:bg-[#FAF7F0] transition-all hover:scale-105 cursor-pointer"
            onClick={onStart}
            size="lg"
          >
            <Compass className="text-emerald-800" />
            {user ? '立即规划行程手账' : '登录开始规划'}
          </Button>
        </div>
      </section>
      <ComplianceFooter />
    </main>
  )
}
