'use client'

import type { CommunityPost, CommunityPostFilters } from '@/types/community'

import { Plus, Repeat2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { fetchCommunityPosts, likeCommunityPost, repostCommunityPost, unlikeCommunityPost } from '@/api/community'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { CommunityPostCardSkeleton } from '@/components/CommunityPostCard/skeleton'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAppToast } from '@/hooks/useAppToast'
import { useAuthStore } from '@/stores/auth'

import './style.css'

const PAGE_SIZE = 10

export default function Community() {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  const [items, setItems] = useState<CommunityPost[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<CommunityPostFilters>({ page: 1, pageSize: PAGE_SIZE })
  const [cityInput, setCityInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likePendingIds, setLikePendingIds] = useState<Set<string>>(() => new Set())
  const [repostPendingIds, setRepostPendingIds] = useState<Set<string>>(() => new Set())
  const [repostTarget, setRepostTarget] = useState<CommunityPost | null>(null)
  const [repostContent, setRepostContent] = useState('')

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

  function requireLogin(action: string) {
    if (!hasHydrated) {
      toast.info('正在恢复登录状态...')
      return false
    }
    if (!user) {
      toast.info(`请先登录后${action}`)
      router.push('/login')
      return false
    }
    return true
  }

  function updateFilters(patch: CommunityPostFilters) {
    const next = { ...filters, ...patch, page: patch.page || 1, pageSize: PAGE_SIZE }
    load(next)
  }

  function handleSearch(event: { preventDefault: () => void }) {
    event.preventDefault()
    updateFilters({ city: cityInput.trim() })
  }

  function clearFilters() {
    setCityInput('')
    load({ page: 1, pageSize: PAGE_SIZE })
  }

  async function toggleLike(post: CommunityPost) {
    if (!requireLogin('点赞'))
      return

    setLikePendingIds(prev => new Set(prev).add(post.id))
    try {
      const result = post.likedByMe ? await unlikeCommunityPost(post.id) : await likeCommunityPost(post.id)
      setItems(prev => prev.map(item => item.id === post.id ? { ...item, likedByMe: result.likedByMe, likeCount: result.likeCount } : item))
      toast.success(result.likedByMe ? '已点赞' : '已取消点赞')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '点赞操作失败')
    }
    finally {
      setLikePendingIds((prev) => {
        const next = new Set(prev)
        next.delete(post.id)
        return next
      })
    }
  }

  function openRepost(post: CommunityPost) {
    if (!requireLogin('转发'))
      return
    setRepostTarget(post)
    setRepostContent('')
  }

  async function submitRepost() {
    if (!repostTarget)
      return

    setRepostPendingIds(prev => new Set(prev).add(repostTarget.id))
    try {
      const repost = await repostCommunityPost(repostTarget.id, repostContent.trim())
      setItems(prev => [repost, ...prev])
      setTotal(prev => prev + 1)
      setRepostTarget(null)
      setRepostContent('')
      toast.success('已转发到社区')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '转发失败')
    }
    finally {
      setRepostPendingIds((prev) => {
        const next = new Set(prev)
        next.delete(repostTarget.id)
        return next
      })
    }
  }

  const hasActiveFilters = Boolean(filters.city || filters.withItinerary || filters.authorId)

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
                    onLike={toggleLike}
                    onComment={item => router.push(`/community/${item.id}`)}
                    onRepost={openRepost}
                  />
                ))}
              </section>
              {total > PAGE_SIZE
                ? (
                    <div className="community-page__pagination flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        disabled={(filters.page || 1) <= 1}
                        onClick={() => updateFilters({ page: (filters.page || 1) - 1 })}
                      >
                        上一页
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        第 {filters.page || 1} 页，共 {Math.ceil(total / PAGE_SIZE)} 页
                      </span>
                      <Button
                        variant="outline"
                        disabled={(filters.page || 1) >= Math.ceil(total / PAGE_SIZE)}
                        onClick={() => updateFilters({ page: (filters.page || 1) + 1 })}
                      >
                        下一页
                      </Button>
                    </div>
                  )
                : null}
            </>
          )
        : null}

      {repostTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="bg-background rounded-2xl p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">转发旅行分享</h3>
            <p className="community-page__modal-intro mb-4">
              可以直接转发，也可以写一句给旅友的补充说明。
            </p>
            <textarea
              className="flex min-h-[80px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm mb-4"
              value={repostContent}
              maxLength={500}
              rows={4}
              placeholder="例如：这条路线适合第一次去成都的朋友"
              onChange={event => setRepostContent(event.target.value)}
            />
            <div className="community-page__modal-target mb-4">
              <Repeat2 aria-hidden="true" />
              <span>{repostTarget.title || repostTarget.content || `${repostTarget.city || '旅行'}分享`}</span>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRepostTarget(null)}>取消</Button>
              <Button disabled={repostPendingIds.has(repostTarget.id)} onClick={submitRepost}>
                {repostPendingIds.has(repostTarget.id) ? '转发中...' : '转发'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
