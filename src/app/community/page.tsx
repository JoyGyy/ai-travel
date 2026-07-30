'use client'

import type { CommunityPost, CommunityPostFilters } from '@/types/community'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchCommunityPosts } from '@/api/community'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { CommunityPostCardSkeleton } from '@/components/CommunityPostCard/skeleton'
import { Pagination } from '@/components/Pagination'
import { RepostModal } from '@/components/RepostModal'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCommunityActions } from '@/hooks/useCommunityActions'

import './style.css'

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

  const { user, requireLogin, toggleLike, submitRepost } = useCommunityActions({
    onLikeSuccess: (postId, likedByMe, likeCount) => {
      setItems(prev => prev.map(item =>
        item.id === postId ? { ...item, likedByMe, likeCount } : item,
      ))
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

  const updateFilters = useCallback((patch: CommunityPostFilters) => {
    const next = { ...filters, ...patch, page: patch.page || 1, pageSize: PAGE_SIZE }
    load(next)
  }, [filters, load])

  const handleSearch = useCallback((event: { preventDefault: () => void }) => {
    event.preventDefault()
    updateFilters({ city: cityInput.trim() })
  }, [updateFilters, cityInput])

  const clearFilters = useCallback(() => {
    setCityInput('')
    load({ page: 1, pageSize: PAGE_SIZE })
  }, [load])

  const handleLike = useCallback(async (post: CommunityPost) => {
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
  }, [toggleLike])

  const openRepost = useCallback((post: CommunityPost) => {
    if (!requireLogin('转发'))
      return
    setRepostTarget(post)
  }, [requireLogin])

  const handleSubmitRepost = useCallback(async (content: string) => {
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
  }, [repostTarget, submitRepost, filters])

  const hasActiveFilters = useMemo(() =>
    Boolean(filters.city || filters.withItinerary || filters.authorId),
  [filters])

  return (
    <main className="community-page travel-page-shell" aria-labelledby="community-title">
      <section className="community-page__hero travel-page-hero travel-ticket-edge travel-route-line">
        <div>
          <p className="community-page__label">TRAVEL COMMUNITY</p>
          <h1 id="community-title">旅友正在路上</h1>
          <p>把 AI 规划、实拍照片和旅行心得做成一张明信片，让下一位出发的人少走弯路。</p>
        </div>
        <Button size="lg" onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}>
          <Plus aria-hidden="true" className="mr-2 h-4 w-4" />
          发布旅行分享
        </Button>
      </section>

      <section className="community-page__filters travel-surface-card" aria-labelledby="community-filter-title">
        <div className="community-page__filters-header">
          <h2 id="community-filter-title">筛选分享</h2>
          {hasActiveFilters ? <Button variant="link" onClick={clearFilters}>清空筛选</Button> : null}
        </div>
        <form className="community-page__search" onSubmit={handleSearch}>
          <label htmlFor="community-city">城市</label>
          <div className="community-page__search-control">
            <Input className="flex-1"
              id="community-city"
              placeholder="输入城市，例如 成都"
              value={cityInput}
              onChange={event => setCityInput(event.target.value)}
            />
            <Button type="submit">搜索</Button>
          </div>
        </form>
        <div className="community-page__switch-row">
          <span>只看含行程分享</span>
          <input
            type="checkbox"
            checked={Boolean(filters.withItinerary)}
            onChange={event => updateFilters({ withItinerary: event.target.checked })}
            aria-label="只看含行程分享"
          />
        </div>
        <p className="community-page__result-status" aria-live="polite">
          {loading ? '正在刷新社区...' : `共 ${total} 条旅行分享`}
        </p>
      </section>

      {loading
        ? (
            <section className="community-page__feed" role="status" aria-live="polite">
              {Array.from({ length: 3 }).map((_, i) => (
                <CommunityPostCardSkeleton key={i} />
              ))}
            </section>
          )
        : null}

      {!loading && error
        ? (
            <div className="community-page__state travel-surface-card" role="alert">
              <p>{error}</p>
              <Button onClick={() => load(filters)}>重试</Button>
            </div>
          )
        : null}

      {!loading && !error && items.length === 0
        ? (
            <div className="community-page__state travel-surface-card">
              <div className="text-center py-8 text-muted-foreground"><p>还没有符合条件的旅行分享</p></div>
              <Button onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}>发布第一条分享</Button>
            </div>
          )
        : null}

      {!loading && !error && items.length > 0
        ? (
            <>
              <section className="community-page__feed" aria-label="社区分享列表">
                {items.map(post => (
                  <CommunityPostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id}
                    likePending={likePendingIds.has(post.id)}
                    repostPending={repostPendingIds.has(post.id)}
                    onLike={handleLike}
                    onComment={item => router.push(`/community/${item.id}`)}
                    onRepost={openRepost}
                  />
                ))}
              </section>
              <Pagination
                className="community-page__pagination"
                page={filters.page || 1}
                total={total}
                pageSize={PAGE_SIZE}
                onPageChange={page => updateFilters({ page })}
              />
            </>
          )
        : null}

      <RepostModal
        open={Boolean(repostTarget)}
        targetTitle={repostTarget?.title || repostTarget?.content || `${repostTarget?.city || '旅行'}分享`}
        pending={repostTarget ? repostPendingIds.has(repostTarget.id) : false}
        onClose={() => setRepostTarget(null)}
        onSubmit={handleSubmitRepost}
      />
    </main>
  )
}
