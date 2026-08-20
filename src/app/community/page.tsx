'use client'

import type { CommunityPost, CommunityPostFilters } from '@/types/community'
import { Camera, Heart, MapPin, Plus, Quote, Star, TrendingUp, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchCommunityPosts } from '@/api/community'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { CommunityPostCardSkeleton } from '@/components/CommunityPostCard/skeleton'
import { Pagination } from '@/components/Pagination'
import { RepostModal } from '@/components/RepostModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CITY_FOCUS_TAGS, TRAVEL_QUOTES, TRENDING_TAGS } from '@/constants/community'
import { useCommunityActions } from '@/hooks/useCommunityActions'

// 社区统计数据（基于 total 动态计算）
function getStats(total: number) {
  return [
    { icon: <Camera size={20} />, label: '旅行分享', value: total },
    { icon: <Users size={20} />, label: '活跃旅友', value: Math.max(1, Math.floor(total * 2.3)) },
    { icon: <MapPin size={20} />, label: '覆盖城市', value: Math.max(1, Math.floor(total * 0.8)) },
    { icon: <Heart size={20} />, label: '收获点赞', value: Math.max(1, Math.floor(total * 12.5)) },
  ]
}

const PAGE_SIZE = 10

export default function Community() {
  const router = useRouter()

  const [items, setItems] = useState<CommunityPost[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<CommunityPostFilters>({ page: 1, pageSize: PAGE_SIZE })
  const [cityInput, setCityInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(() => new Set())
  const [repostPendingIds, setRepostPendingIds] = useState<Set<string>>(() => new Set())
  const [repostTarget, setRepostTarget] = useState<CommunityPost | null>(null)

  const { hasHydrated, requireLogin, submitRepost, toggleLike, user } = useCommunityActions({
    onLikeSuccess: (postId, likedByMe, likeCount) => {
      setItems(prev =>
        prev.map(item => (item.id === postId ? { ...item, likeCount, likedByMe } : item)),
      )
    },
  })

  const load = useCallback(async (nextFilters: CommunityPostFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchCommunityPosts({ ...nextFilters, pageSize: PAGE_SIZE })
      setItems(data.items)
      setTotal(data.total)
      setFilters({ ...nextFilters, page: data.page, pageSize: data.pageSize })
    }
    catch (err: unknown) {
      setError(err instanceof Error ? err.message : '社区内容加载失败')
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => load({ page: 1, pageSize: PAGE_SIZE }))
  }, [load])

  // requireLogin 已从 useCommunityActions hook 获取

  const updateFilters = useCallback(
    (patch: CommunityPostFilters) => {
      const next = { ...filters, ...patch, page: patch.page || 1, pageSize: PAGE_SIZE }
      load(next)
    },
    [filters, load],
  )

  const handleSearch = useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault()
      updateFilters({ city: cityInput.trim() })
    },
    [updateFilters, cityInput],
  )

  const clearFilters = useCallback(() => {
    setCityInput('')
    load({ page: 1, pageSize: PAGE_SIZE })
  }, [load])

  const handleLike = useCallback(
    async (post: CommunityPost) => {
      setLikePendingIds(prev => new Set(prev).add(post.id))
      try {
        await toggleLike(post.id, post.likedByMe)
      }
      finally {
        setLikePendingIds((prev) => {
          const next = new Set(prev)
          next.delete(post.id)
          return next
        })
      }
    },
    [toggleLike],
  )

  const openRepost = useCallback(
    (post: CommunityPost) => {
      if (!requireLogin('转发'))
        return
      setRepostTarget(post)
    },
    [requireLogin],
  )

  const handleSubmitRepost = useCallback(
    async (content: string) => {
      if (!repostTarget)
        return false

      setRepostPendingIds(prev => new Set(prev).add(repostTarget.id))
      try {
        const success = await submitRepost(repostTarget.id, content)
        if (success) {
          // 刷新列表以显示新转发
          const data = await fetchCommunityPosts({ ...filters, pageSize: PAGE_SIZE })
          setItems(data.items)
          setTotal(data.total)
          setRepostTarget(null)
        }
        return success
      }
      finally {
        setRepostPendingIds((prev) => {
          const next = new Set(prev)
          next.delete(repostTarget.id)
          return next
        })
      }
    },
    [repostTarget, submitRepost, filters],
  )

  const hasActiveFilters = useMemo(
    () => Boolean(filters.city || filters.withItinerary || filters.authorId),
    [filters],
  )

  return (
    <main aria-labelledby="community-title" className="travel-page-shell gap-6">
      {/* Hero 区域 */}
      <section className="relative overflow-hidden rounded-3xl bg-teal-50/60 p-8">
        {/* 装饰元素 */}
        <div className="absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-teal-200/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-[180px] w-[180px] rounded-full bg-cyan-200/10 blur-3xl" />

        <div className="relative flex items-center justify-between gap-5">
          <div className="animate-fade-in-up">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-teal-500">
              TRAVEL COMMUNITY
            </p>
            <h1
              className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.15]"
              id="community-title"
            >
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                旅友正在路上
              </span>
            </h1>
            <p className="mt-2 max-w-[500px] text-[0.95rem] leading-relaxed text-gray-500">
              把 AI 规划、实拍照片和旅行心得做成一张明信片，让下一位出发的人少走弯路。
            </p>
          </div>
          <Button
            className="gap-2 shadow-lg shadow-teal-500/25 hover:shadow-xl hover:shadow-teal-500/30"
            disabled={!hasHydrated}
            onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}
            size="lg"
          >
            <Plus aria-hidden="true" className="h-4 w-4" />
            {!hasHydrated ? '加载中...' : '发布旅行分享'}
          </Button>
        </div>

        {/* 社区统计 */}
        <div className="relative mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {getStats(total).map(stat => (
            <Card className="border-white/60 bg-white/80 backdrop-blur-sm" key={stat.label}>
              <CardContent className="flex items-center gap-3 p-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                  {stat.icon}
                </span>
                <div>
                  <p className="text-lg font-bold text-gray-900">{loading ? '-' : stat.value.toLocaleString()}</p>
                  <p className="text-2.75 text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* 热门标签 */}
      <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
        <div className="mb-4 flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-teal-500" />
          <h2 className="text-sm font-semibold text-gray-700">热门话题</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_TAGS.map(tag => (
            <Badge
              className={`cursor-pointer border px-3 py-1.5 text-xs font-semibold transition-all hover:-translate-y-0.5 hover:shadow-sm ${tag.color}`}
              key={tag.label}
              onClick={() => {
                setCityInput('')
                updateFilters({ city: '' })
              }}
              variant="outline"
            >
              #
              {' '}
              {tag.label}
            </Badge>
          ))}
        </div>
      </section>

      {/* 每日旅行语录 + 城市聚焦 */}
      <div className="grid gap-4 sm:grid-cols-2 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
        {/* 旅行语录 */}
        <Card className="relative overflow-hidden border-white/60 bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-50 backdrop-blur-sm">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-teal-200/30 to-cyan-200/30 blur-2xl" />
          <CardContent className="relative p-5">
            <div className="mb-3 flex items-center gap-2">
              <Quote className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-teal-500 uppercase tracking-wider">旅行语录</span>
            </div>
            <blockquote className="text-sm leading-relaxed text-gray-700 italic">
              {TRAVEL_QUOTES[new Date().getDay() % 4]}
            </blockquote>
            <p className="mt-3 text-xs text-gray-400">— 每日一句，送给在路上的你</p>
          </CardContent>
        </Card>

        {/* 城市聚焦 */}
        <Card className="relative overflow-hidden border-white/60 bg-teal-50/60 backdrop-blur-sm">
          <div className="absolute -left-8 -bottom-8 h-24 w-24 rounded-full bg-cyan-200/15 blur-2xl" />
          <CardContent className="relative p-5">
            <div className="mb-3 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-400" />
              <span className="text-xs font-semibold text-teal-500 uppercase tracking-wider">城市聚焦</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-500 text-2xl text-white shadow-lg">
                🐼
              </div>
              <div>
                <p className="text-base font-bold text-gray-900">成都</p>
                <p className="text-xs text-gray-500">美食之都 · 大熊猫故乡</p>
                <div className="mt-1.5 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    // eslint-disable-next-line react/no-array-index-key
                    <Star key={i} className={`h-3 w-3 ${i < 4 ? 'fill-cyan-400 text-cyan-400' : 'text-gray-300'}`} />
                  ))}
                  <span className="ml-1 text-2.5 text-gray-400">旅友推荐</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {CITY_FOCUS_TAGS.map(tag => (
                <Badge className="border-teal-200 bg-teal-50 text-2.5 text-teal-600" key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选区 */}
      <section
        aria-labelledby="community-filter-title"
        className="grid gap-3.5 rounded-2xl border border-white/60 bg-white/80 p-5 shadow-sm backdrop-blur-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-travel-ink" id="community-filter-title">
            筛选分享
          </h2>
          {hasActiveFilters
            ? (
                <Button onClick={clearFilters} variant="link">
                  清空筛选
                </Button>
              )
            : null}
        </div>
        <form className="grid gap-1.5" onSubmit={handleSearch}>
          <Label className="text-3.25 font-medium" htmlFor="community-city">
            城市
          </Label>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input
              className="flex-1"
              id="community-city"
              onChange={event => setCityInput(event.target.value)}
              placeholder="输入城市，例如 成都"
              value={cityInput}
            />
            <Button type="submit">搜索</Button>
          </div>
        </form>
        <div className="flex items-center justify-between gap-3">
          <span className="text-3.25 font-medium text-travel-ink">只看含行程分享</span>
          <input
            aria-label="只看含行程分享"
            checked={Boolean(filters.withItinerary)}
            onChange={event => updateFilters({ withItinerary: event.target.checked })}
            type="checkbox"
          />
        </div>
        <p aria-live="polite" className="text-3.25 text-travel-muted">
          {loading ? '正在刷新社区...' : `共 ${total} 条旅行分享`}
        </p>
      </section>

      {loading
        ? (
            <section aria-live="polite" className="columns-1 sm:columns-2 gap-4" role="status">
              {Array.from({ length: 3 }).map((_, i) => (
                // eslint-disable-next-line react/no-array-index-key
                <CommunityPostCardSkeleton key={i} />
              ))}
            </section>
          )
        : null}

      {!loading && error
        ? (
            <div
              className="grid place-items-center gap-3 rounded-xl p-6 text-center text-travel-muted"
              role="alert"
            >
              <p>{error}</p>
              <Button onClick={() => load(filters)}>重试</Button>
            </div>
          )
        : null}

      {!loading && !error && items.length === 0
        ? (
            <div className="grid place-items-center gap-3 rounded-xl p-6 text-center text-travel-muted">
              <div className="py-8 text-center text-muted-foreground">
                <p>还没有符合条件的旅行分享</p>
              </div>
              <Button
                disabled={!hasHydrated}
                onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}
              >
                {!hasHydrated ? '加载中...' : '发布第一条分享'}
              </Button>
            </div>
          )
        : null}

      {!loading && !error && items.length > 0
        ? (
            <>
              <section
                aria-label="社区分享列表"
                className="columns-1 sm:columns-2 gap-4 break-inside-avoid"
              >
                {items.map(post => (
                  <CommunityPostCard
                    currentUserId={user?.id}
                    key={post.id}
                    likePending={likePendingIds.has(post.id)}
                    onComment={item => router.push(`/community/${item.id}`)}
                    onLike={handleLike}
                    onRepost={openRepost}
                    post={post}
                    repostPending={repostPendingIds.has(post.id)}
                  />
                ))}
              </section>
              <Pagination
                className="flex justify-center py-2 pb-6"
                onPageChange={page => updateFilters({ page })}
                page={filters.page || 1}
                pageSize={PAGE_SIZE}
                total={total}
              />
            </>
          )
        : null}

      <RepostModal
        onClose={() => setRepostTarget(null)}
        onSubmit={handleSubmitRepost}
        open={Boolean(repostTarget)}
        pending={repostTarget ? repostPendingIds.has(repostTarget.id) : false}
        targetTitle={
          repostTarget?.title || repostTarget?.content || `${repostTarget?.city || '旅行'}分享`
        }
      />
    </main>
  )
}
