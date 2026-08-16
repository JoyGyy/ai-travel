'use client'

import { ArrowLeft, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * 景点详情页面
 *
 * 根据 URL 参数加载景点详情，展示封面、介绍、实用信息、
 * 游玩亮点、注意事项和购票入口，支持收藏和 AI 行程规划跳转。
 */
import type { Attraction } from '@/types/attraction'

import { fetchAttractionDetail } from '@/api/attractions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAttractionFavorite } from '@/hooks/useAttractionFavorite'

export default function AttractionDetail() {
  // ---- 路由参数与状态 ----
  const params = useParams()
  const id = (params?.id as string) || ''
  const router = useRouter()
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoritePending, setFavoritePending] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const { toggleFavorite } = useAttractionFavorite({
    onFavoriteSuccess: (_attractionId, isFavorite) => {
      if (attraction) {
        setAttraction({ ...attraction, isFavorite })
      }
    },
  })

  // ---- 加载景点数据 ----
  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAttractionDetail(id)
        if (!cancelled) setAttraction({ ...data.attraction, isFavorite: data.isFavorite })
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : '景点加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  /** 切换收藏状态 */
  async function handleToggleFavorite() {
    if (!attraction) return
    setFavoritePending(true)
    try {
      await toggleFavorite(attraction.id, attraction.isFavorite ?? false)
    } finally {
      setFavoritePending(false)
    }
  }

  // ---- 加载中状态 ----
  if (loading) {
    return (
      <main
        aria-labelledby="attraction-loading-title"
        className="travel-page-shell"
      >
        <div
          aria-live="polite"
          className="flex flex-col items-center gap-3 rounded-xl p-6"
          role="status"
        >
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
          <h1 className="text-xl font-bold text-travel-ink" id="attraction-loading-title">
            加载景点详情中...
          </h1>
          <p className="text-travel-muted">正在取出这张目的地票根。</p>
        </div>
      </main>
    )
  }
  // ---- 错误/空数据状态 ----
  if (error || !attraction) {
    return (
      <main
        aria-labelledby="attraction-error-title"
        className="travel-page-shell"
      >
        <div className="flex flex-col items-center gap-3 rounded-xl p-6" role="alert">
          <h1 className="text-xl font-bold text-travel-ink" id="attraction-error-title">
            景点暂时无法打开
          </h1>
          <p className="text-travel-muted">{error || '景点不存在或已下架'}</p>
          <div className="flex gap-3">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setReloadKey((prev) => prev + 1)}
            >
              重试
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push('/attractions')}
            >
              返回景点列表
            </Button>
          </div>
        </div>
      </main>
    )
  }

  // ---- 构建 AI 规划跳转参数 ----
  const prompt = encodeURIComponent(
    `帮我规划一个包含${attraction.city}${attraction.name}的旅行行程`,
  )
  const ticketTypeClass = attraction.ticketType === 'free' ? 'travel-tag--free' : 'travel-tag--paid'

  return (
    <main aria-labelledby="attraction-detail-title" className="travel-page-shell">
      <button
        className="inline-flex w-fit items-center gap-2 rounded-full bg-white/78 px-4 py-2.5 text-sm font-extrabold text-travel-ink shadow-sm transition-all hover:-translate-x-1 hover:text-accent hover:shadow-md"
        onClick={() => router.back()}
        type="button"
      >
        <ArrowLeft aria-hidden="true" />
        <span>返回</span>
      </button>

      {/* ---- 封面与操作区 ---- */}
      <section className="travel-surface-card travel-ticket-edge travel-route-line overflow-hidden">
        <Image
          alt={`${attraction.name}，${attraction.city}景点封面`}
          className="h-[500px] w-full object-cover"
          height={500}
          loading="eager"
          src={attraction.coverImage}
          unoptimized
          width={800}
        />
        <div className="p-6">
          <p className="mb-2 text-sm font-medium text-primary">{attraction.city}</p>
          <h1 className="mb-3 text-3xl font-bold text-travel-ink" id="attraction-detail-title">
            {attraction.name}
          </h1>
          <p className="mb-4 text-travel-muted">{attraction.summary}</p>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge className={`travel-tag ${ticketTypeClass}`}>
              {attraction.ticketType === 'free' ? '免费' : '收费'}
            </Badge>
            <Badge className="travel-tag travel-tag--warning">{attraction.priceText}</Badge>
            {attraction.tags.map((tag) => (
              <Badge className="travel-tag travel-tag--info" key={tag}>
                {tag}
              </Badge>
            ))}
          </div>
          <div className="flex gap-3">
            <Button
              aria-label={`${attraction.isFavorite ? '取消收藏' : '收藏'}${attraction.name}`}
              aria-pressed={Boolean(attraction.isFavorite)}
              disabled={favoritePending}
              onClick={handleToggleFavorite}
            >
              <Heart
                aria-hidden="true"
                className={`mr-2 h-4 w-4 ${attraction.isFavorite ? 'fill-current' : ''}`}
              />
              {favoritePending ? '处理中...' : attraction.isFavorite ? '已收藏' : '收藏'}
            </Button>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              href={`/chat?prompt=${prompt}`}
            >
              让 AI 规划这站
            </Link>
          </div>
        </div>
      </section>

      {/* ---- 景点介绍 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">景点介绍</h2>
        <p className="leading-relaxed text-travel-muted">{attraction.description}</p>
      </section>

      {/* ---- 实用信息 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">实用信息</h2>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-travel-muted">地址</dt>
            <dd className="mt-1 text-travel-ink">{attraction.address}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-travel-muted">开放时间</dt>
            <dd className="mt-1 text-travel-ink">{attraction.openingHours}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-travel-muted">建议游玩</dt>
            <dd className="mt-1 text-travel-ink">{attraction.recommendedDuration}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-travel-muted">票价</dt>
            <dd className="mt-1 text-travel-ink">{attraction.priceText}</dd>
          </div>
        </dl>
      </section>

      {/* ---- 游玩亮点 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">游玩亮点</h2>
        <ul className="list-inside list-disc space-y-2 text-travel-muted">
          {attraction.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {/* ---- 注意事项 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">注意事项</h2>
        <ul className="list-inside list-disc space-y-2 text-travel-muted">
          {attraction.tips.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {/* ---- 购票入口 ---- */}
      <section className="travel-surface-card p-6">
        <h2 className="mb-4 text-xl font-bold text-travel-ink">购票入口</h2>
        <p className="mb-4 text-sm text-travel-muted">
          价格、库存和开放时间以第三方平台及景区官方公告为准。
        </p>
        <div className="flex flex-wrap gap-3">
          {buildBookingLinks(attraction).map((link) => (
            <a
              aria-label={`去${link.label}查看${attraction.name}门票，打开新窗口`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-travel-ink shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              href={link.href}
              key={link.key}
              rel="noopener noreferrer"
              target="_blank"
            >
              去{link.label}
              查看
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}

/** 构建购票链接列表，优先使用真实链接，缺失时降级为搜索 URL */
function buildBookingLinks(attraction: Attraction) {
  return [
    {
      href: attraction.bookingLinks.ctrip || buildSearchUrl('ctrip', attraction),
      key: 'ctrip' as const,
      label: '携程',
    },
    {
      href: attraction.bookingLinks.fliggy || buildSearchUrl('fliggy', attraction),
      key: 'fliggy' as const,
      label: '飞猪',
    },
    {
      href: attraction.bookingLinks.ly || buildSearchUrl('ly', attraction),
      key: 'ly' as const,
      label: '同程',
    },
  ]
}

/** 生成搜索 URL 降级地址（无真实购票链接时使用） */
function buildSearchUrl(platform: 'ctrip' | 'fliggy' | 'ly', attraction: Attraction) {
  const keyword = encodeURIComponent(`${attraction.city} ${attraction.name} 门票`)
  if (platform === 'ctrip') return `https://you.ctrip.com/searchsite/?query=${keyword}`
  if (platform === 'fliggy') return `https://s.taobao.com/search?q=${keyword}`
  return `https://www.ly.com/scenery/scenerysearchlist_${keyword}.html`
}
