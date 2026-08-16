'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import type { CommunityPost, CommunityPostFilters } from '@/types/community'

import { fetchCommunityPosts } from '@/api/community'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { CommunityPostCardSkeleton } from '@/components/CommunityPostCard/skeleton'
import { Pagination } from '@/components/Pagination'
import { RepostModal } from '@/components/RepostModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCommunityActions } from '@/hooks/useCommunityActions'

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
      setItems((prev) =>
        prev.map((item) => (item.id === postId ? { ...item, likeCount, likedByMe } : item)),
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '社区内容加载失败')
    } finally {
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
      setLikePendingIds((prev) => new Set(prev).add(post.id))
      try {
        await toggleLike(post.id, post.likedByMe)
      } finally {
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
      if (!requireLogin('转发')) return
      setRepostTarget(post)
    },
    [requireLogin],
  )

  const handleSubmitRepost = useCallback(
    async (content: string) => {
      if (!repostTarget) return false

      setRepostPendingIds((prev) => new Set(prev).add(repostTarget.id))
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
      } finally {
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
    <main aria-labelledby="community-title" className="travel-page-shell gap-5">
      <section className="travel-page-hero travel-ticket-edge travel-route-line">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="mb-2 text-[0.75rem] font-bold uppercase tracking-[0.15em] text-primary">
              TRAVEL COMMUNITY
            </p>
            <h1 className="text-[clamp(1.8rem,4vw,3rem)] leading-[1.15] text-travel-ink" id="community-title">
              旅友正在路上
            </h1>
            <p className="mt-2 max-w-[500px] text-[0.95rem] leading-relaxed text-travel-muted">
              把 AI 规划、实拍照片和旅行心得做成一张明信片，让下一位出发的人少走弯路。
            </p>
          </div>
          <Button
            disabled={!hasHydrated}
            onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}
            size="lg"
          >
            <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
            {!hasHydrated ? '加载中...' : '发布旅行分享'}
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="community-filter-title"
        className="travel-surface-card grid gap-3.5 rounded-xl p-4"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-travel-ink" id="community-filter-title">
            筛选分享
          </h2>
          {hasActiveFilters ? (
            <Button onClick={clearFilters} variant="link">
              清空筛选
            </Button>
          ) : null}
        </div>
        <form className="grid gap-1.5" onSubmit={handleSearch}>
          <label className="text-[13px] font-medium text-travel-ink" htmlFor="community-city">
            城市
          </label>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <Input
              className="flex-1"
              id="community-city"
              onChange={(event) => setCityInput(event.target.value)}
              placeholder="输入城市，例如 成都"
              value={cityInput}
            />
            <Button type="submit">搜索</Button>
          </div>
        </form>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-travel-ink">只看含行程分享</span>
          <input
            aria-label="只看含行程分享"
            checked={Boolean(filters.withItinerary)}
            onChange={(event) => updateFilters({ withItinerary: event.target.checked })}
            type="checkbox"
          />
        </div>
        <p aria-live="polite" className="text-[13px] text-travel-muted">
          {loading ? '正在刷新社区...' : `共 ${total} 条旅行分享`}
        </p>
      </section>

      {loading ? (
        <section aria-live="polite" className="columns-2 gap-4" role="status">
          {Array.from({ length: 3 }).map((_, i) => (
            <CommunityPostCardSkeleton key={i} />
          ))}
        </section>
      ) : null}

      {!loading && error ? (
        <div className="grid place-items-center gap-3 rounded-xl p-6 text-center text-travel-muted" role="alert">
          <p>{error}</p>
          <Button onClick={() => load(filters)}>重试</Button>
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
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
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <section aria-label="社区分享列表" className="columns-2 gap-4 break-inside-avoid">
            {items.map((post) => (
              <CommunityPostCard
                currentUserId={user?.id}
                key={post.id}
                likePending={likePendingIds.has(post.id)}
                onComment={(item) => router.push(`/community/${item.id}`)}
                onLike={handleLike}
                onRepost={openRepost}
                post={post}
                repostPending={repostPendingIds.has(post.id)}
              />
            ))}
          </section>
          <Pagination
            className="flex justify-center py-2 pb-6"
            onPageChange={(page) => updateFilters({ page })}
            page={filters.page || 1}
            pageSize={PAGE_SIZE}
            total={total}
          />
        </>
      ) : null}

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
