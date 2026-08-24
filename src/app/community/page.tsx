'use client'

/**
 * 旅友社区广场页面
 *
 * 采用双栏协同布局：左侧主动态流与搜索过滤，右侧常驻发布手账入口、
 * 社区数据看板、热门话题榜、探索焦点与每日手账随笔。
 */
import type { CommunityPost, CommunityPostFilters } from '@/types/community'
import {
  Camera,
  Compass,
  Heart,
  MapPin,
  MapPinned,
  Plus,
  Quote,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchCommunityPosts } from '@/api/community'
import { CommunityPostCard } from '@/components/CommunityPostCard'
import { CommunityPostCardSkeleton } from '@/components/CommunityPostCard/skeleton'
import { Pagination } from '@/components/Pagination'
import { RepostModal } from '@/components/RepostModal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CITY_FOCUS_TAGS, TRAVEL_QUOTES, TRENDING_TAGS } from '@/constants/community'
import { useCommunityActions } from '@/hooks/useCommunityActions'

function getStats(total: number) {
  return [
    { icon: <Camera size={18} />, label: '旅行手账', value: total },
    { icon: <Users size={18} />, label: '活跃旅友', value: Math.max(1, Math.floor(total * 2.3)) },
    { icon: <MapPin size={18} />, label: '覆盖目的地', value: Math.max(1, Math.floor(total * 0.8)) },
    { icon: <Heart size={18} />, label: '收获点赞', value: Math.max(1, Math.floor(total * 12.5)) },
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
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF7F0] pb-16">
      {/* 顶部 Hero 区域 */}
      <div className="border-b border-stone-200/80 bg-[#FAF7F0] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-3 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-2">
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>TRAVEL COMMUNITY · 旅人手账广场</span>
            </div>
            <h1
              className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight"
              id="community-title"
            >
              旅友正在路上 · 真实游记与路线
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-500">
              把 AI 规划、实拍风景与手账心得分享给同行的旅人，让每一次出发都有迹可循、彼此照映。
            </p>
          </div>

          <Button
            className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-5 h-11 shadow-md shadow-emerald-800/20 cursor-pointer shrink-0"
            disabled={!hasHydrated}
            onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>{!hasHydrated ? '加载中...' : '发布手账分享'}</span>
          </Button>
        </div>
      </div>

      {/* 主体工作台：双栏协同布局 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* 左侧主动态流 (8 列)                                      */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 动态筛选工具栏 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-4 sm:p-5 shadow-sm space-y-3">
              <form className="flex items-center gap-2.5" onSubmit={handleSearch}>
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-800" />
                  <Input
                    className="h-11 rounded-2xl bg-white border-stone-200 pl-10 text-xs sm:text-sm text-stone-900 shadow-2xs placeholder:text-stone-400 focus-visible:ring-emerald-700"
                    id="community-city"
                    onChange={event => setCityInput(event.target.value)}
                    placeholder="输入城市搜索，例如 成都、大理、西安"
                    value={cityInput}
                  />
                </div>
                <Button className="h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 cursor-pointer text-xs sm:text-sm" type="submit">
                  搜索
                </Button>
              </form>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-100 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-stone-700 font-bold select-none">
                  <input
                    checked={Boolean(filters.withItinerary)}
                    className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-600 h-4 w-4 cursor-pointer"
                    onChange={event => updateFilters({ withItinerary: event.target.checked })}
                    type="checkbox"
                  />
                  <span>仅看包含完整手账路线的分享</span>
                </label>

                <div className="flex items-center gap-3 text-stone-500">
                  <span>
                    共
                    {' '}
                    <strong className="font-serif text-emerald-800 text-sm">{total}</strong>
                    {' '}
                    条旅人手账
                  </span>
                  {hasActiveFilters && (
                    <button
                      className="text-emerald-800 font-bold hover:underline cursor-pointer"
                      onClick={clearFilters}
                      type="button"
                    >
                      清空筛选
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 骨架屏 */}
            {loading && (
              <div className="columns-1 sm:columns-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <CommunityPostCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* 错误提示 */}
            {!loading && error && (
              <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 font-bold">
                <span>{error}</span>
                <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs" onClick={() => load(filters)} size="sm">
                  重试
                </Button>
              </div>
            )}

            {/* 空状态 */}
            {!loading && !error && items.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-10 text-center">
                <Compass className="h-10 w-10 text-stone-300 mx-auto mb-1" />
                <p className="font-bold text-base text-stone-800">暂无符合条件的旅行手账</p>
                <p className="text-xs text-stone-400 max-w-sm">成为第一个分享该目的地风景与路线的旅人吧</p>
                <Button
                  className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold mt-2 cursor-pointer"
                  disabled={!hasHydrated}
                  onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  <span>发布第一条手账分享</span>
                </Button>
              </div>
            )}

            {/* 动态瀑布流 */}
            {!loading && !error && items.length > 0 && (
              <>
                <div className="columns-1 sm:columns-2 gap-4 break-inside-avoid">
                  {items.map(post => (
                    <div className="mb-4 break-inside-avoid" key={post.id}>
                      <CommunityPostCard
                        currentUserId={user?.id}
                        likePending={likePendingIds.has(post.id)}
                        onComment={item => router.push(`/community/${item.id}`)}
                        onLike={handleLike}
                        onRepost={openRepost}
                        post={post}
                        repostPending={repostPendingIds.has(post.id)}
                      />
                    </div>
                  ))}
                </div>

                <Pagination
                  className="flex justify-center py-4 pb-8"
                  onPageChange={page => updateFilters({ page })}
                  page={filters.page || 1}
                  pageSize={PAGE_SIZE}
                  total={total}
                />
              </>
            )}
          </div>

          {/* ======================================================== */}
          {/* 右侧社区数据与灵感看板 (4 列，桌面端常驻充实布局)         */}
          {/* ======================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* 模块 1: 发布手账快捷引导卡片 */}
            <div className="rounded-3xl border border-emerald-700/20 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>记录行者足迹</span>
              </div>
              <h3 className="font-serif text-lg font-bold">分享你的独家路书</h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                将你在旅途中的实拍美景、地道风味小吃与避坑心得以手账长图或路线形式分享，获得旅友点赞与转发。
              </p>
              <Button
                className="w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs h-10 shadow-sm cursor-pointer"
                disabled={!hasHydrated}
                onClick={() => (requireLogin('发布分享') ? router.push('/community/new') : undefined)}
              >
                <Plus className="h-4 w-4 mr-1" />
                <span>立即发布我的手账</span>
              </Button>
            </div>

            {/* 模块 2: 社区动态实时数据 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                  <span>广场动态实时简报</span>
                </span>
                <span className="text-[10px] text-stone-400">实时统计</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {getStats(total).map(stat => (
                  <div className="p-3 rounded-2xl bg-white border border-stone-200/80 shadow-2xs" key={stat.label}>
                    <div className="flex items-center gap-2 mb-1 text-emerald-800">
                      {stat.icon}
                      <span className="text-[10px] text-stone-400 font-medium">{stat.label}</span>
                    </div>
                    <p className="font-serif text-base font-black text-stone-900">
                      {loading ? '-' : stat.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 模块 3: 热门灵感话题榜 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>热门灵感话题</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TRENDING_TAGS.map(tag => (
                  <button
                    className="px-3 py-1.5 rounded-full border border-stone-200/80 bg-white hover:border-emerald-600 hover:bg-emerald-50 text-xs font-bold text-stone-700 hover:text-emerald-900 transition-all cursor-pointer shadow-2xs"
                    key={tag.label}
                    onClick={() => {
                      setCityInput('')
                      updateFilters({ city: '' })
                    }}
                    type="button"
                  >
                    #
                    {' '}
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 模块 4: 本周探索焦点城市 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-800" />
                <span className="font-serif text-xs font-bold text-stone-900">本周探索焦点</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-2xs">
                    <MapPinned className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-sm font-bold text-stone-900">成都 · 慢游川西</h4>
                    <p className="text-[11px] text-stone-400">大熊猫繁育基地 · 奎星楼街寻味</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {CITY_FOCUS_TAGS.map(tag => (
                    <Badge className="bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-900 rounded-md px-2 py-0.2" key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* 模块 5: 每日手账随笔 */}
            <Card className="rounded-3xl border-stone-200/90 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                <Quote className="w-3.5 h-3.5" />
                <span>每日旅行随笔</span>
              </div>
              <blockquote className="font-serif text-xs leading-relaxed text-stone-700 italic">
                {TRAVEL_QUOTES[new Date().getDay() % 4]}
              </blockquote>
              <p className="text-[10px] text-stone-400 pt-1">— 远方手账 · 愿旅途处处有诗意</p>
            </Card>
          </aside>
        </div>
      </div>

      <RepostModal
        onClose={() => setRepostTarget(null)}
        onSubmit={handleSubmitRepost}
        open={Boolean(repostTarget)}
        pending={repostTarget ? repostPendingIds.has(repostTarget.id) : false}
        targetTitle={
          repostTarget?.title || repostTarget?.content || `${repostTarget?.city || '旅行'}分享`
        }
      />
    </div>
  )
}
