'use client'

import type { CommunityPost, CommunityPostFilters } from '@/types/community'

import { PlusOutlined, RetweetOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Modal, Pagination, Switch } from 'antd'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { fetchCommunityPosts, likeCommunityPost, repostCommunityPost, unlikeCommunityPost } from '@/api/community'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { CommunityPostCardSkeleton } from '@/components/CommunityPostCard/skeleton'
import { useAppMessage } from '@/hooks/useAppMessage'
import { useAuthStore } from '@/stores/auth'

import './style.css'

const PAGE_SIZE = 10

export default function Community() {
  const router = useRouter()
  const message = useAppMessage()
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
      message.loading('正在恢复登录状态...')
      return false
    }
    if (!user) {
      message.info(`请先登录后${action}`)
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
      message.success(result.likedByMe ? '已点赞' : '已取消点赞')
    }
    catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '点赞操作失败')
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
      message.success('已转发到社区')
    }
    catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '转发失败')
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
        <Button type="primary" size="large" icon={<PlusOutlined aria-hidden="true" />} onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}>
          发布旅行分享
        </Button>
      </section>

      <section className="community-page__filters travel-surface-card" aria-labelledby="community-filter-title">
        <div className="community-page__filters-header">
          <h2 id="community-filter-title">筛选分享</h2>
          {hasActiveFilters ? <Button type="link" onClick={clearFilters}>清空筛选</Button> : null}
        </div>
        <form className="community-page__search" onSubmit={handleSearch}>
          <label htmlFor="community-city">城市</label>
          <div className="community-page__search-control">
            <Input
              id="community-city"
              allowClear
              prefix={<SearchOutlined aria-hidden="true" />}
              placeholder="输入城市，例如 成都"
              value={cityInput}
              onChange={event => setCityInput(event.target.value)}
            />
            <Button type="primary" htmlType="submit">搜索</Button>
          </div>
        </form>
        <div className="community-page__switch-row">
          <span>只看含行程分享</span>
          <Switch checked={Boolean(filters.withItinerary)} onChange={checked => updateFilters({ withItinerary: checked })} aria-label="只看含行程分享" />
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
              <Empty description="还没有符合条件的旅行分享" />
              <Button type="primary" onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}>发布第一条分享</Button>
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
                    <div className="community-page__pagination">
                      <Pagination current={filters.page || 1} pageSize={PAGE_SIZE} total={total} onChange={page => updateFilters({ page })} />
                    </div>
                  )
                : null}
            </>
          )
        : null}

      <Modal
        title="转发旅行分享"
        open={Boolean(repostTarget)}
        okText="转发"
        cancelText="取消"
        confirmLoading={Boolean(repostTarget && repostPendingIds.has(repostTarget.id))}
        onOk={submitRepost}
        onCancel={() => setRepostTarget(null)}
      >
        <p className="community-page__modal-intro">
          可以直接转发，也可以写一句给旅友的补充说明。
        </p>
        <Input.TextArea
          value={repostContent}
          maxLength={500}
          showCount
          rows={4}
          placeholder="例如：这条路线适合第一次去成都的朋友"
          onChange={event => setRepostContent(event.target.value)}
        />
        {repostTarget
          ? (
              <div className="community-page__modal-target">
                <RetweetOutlined aria-hidden="true" />
                <span>{repostTarget.title || repostTarget.content || `${repostTarget.city || '旅行'}分享`}</span>
              </div>
            )
          : null}
      </Modal>
    </main>
  )
}
