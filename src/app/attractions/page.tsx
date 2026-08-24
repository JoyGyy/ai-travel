'use client'

/**
 * 景点列表页面
 *
 * 采用双栏工作台布局：左侧主景点画廊网格与搜索，右侧常驻城市索引、
 * 门票与主题标签筛选、AI 路线编排及当季热门推荐。
 */
import type { Attraction, AttractionFilters, AttractionTicketType } from '@/types/attraction'
import {
  ArrowRight,
  Bot,
  Compass,
  Heart,
  MapPin,
  Search,
  Sparkles,
  Star,
  Tag,
  Ticket,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { fetchAttractions } from '@/api/attractions'
import { Pagination } from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAttractionFavorite } from '@/hooks/useAttractionFavorite'
import { useDebounce } from '@/hooks/useDebounce'

import { AttractionCardSkeleton } from './AttractionCardSkeleton'

const ticketOptions = [
  { label: '全部门票', value: '' },
  { label: '免费开放', value: 'free' },
  { label: '收费门票', value: 'paid' },
]

export default function Attractions() {
  const [items, setItems] = useState<Attraction[]>([])
  const [total, setTotal] = useState(0)
  const [cities, setCities] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filters, setFilters] = useState<AttractionFilters>({})
  const [keywordInput, setKeywordInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoritePendingIds, setFavoritePendingIds] = useState<Set<string>>(() => new Set())

  const { toggleFavorite } = useAttractionFavorite({
    onFavoriteSuccess: (attractionId, isFavorite) => {
      setItems(prev =>
        prev.map(current => (current.id === attractionId ? { ...current, isFavorite } : current)),
      )
    },
  })

  const PAGE_SIZE = 9

  // ---- 数据加载 ----
  const load = useCallback(async (nextFilters: AttractionFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAttractions({ ...nextFilters, pageSize: PAGE_SIZE })
      setItems(data.items)
      setTotal(data.total)
      setCities(data.cities)
      setTags(data.tags)
    }
    catch (err: unknown) {
      setError(err instanceof Error ? err.message : '景点加载失败')
    }
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => load({}))
  }, [load])

  // ---- 筛选条件管理 ----
  const updateFilters = useCallback(
    (patch: AttractionFilters) => {
      const next = { ...filters, ...patch, page: patch.page || 1 }
      setFilters(next)
      load(next)
    },
    [filters, load],
  )

  // 防抖搜索：输入关键词后 300ms 自动触发搜索
  const debouncedSearch = useDebounce((keyword: string) => {
    updateFilters({ keyword: keyword.trim() })
  }, 300)

  // 关键词输入处理
  const handleKeywordChange = useCallback(
    (value: string) => {
      setKeywordInput(value)
      if (!value.trim()) {
        updateFilters({ keyword: '' })
      }
      else {
        debouncedSearch(value)
      }
    },
    [debouncedSearch, updateFilters],
  )

  const handleSearchSubmit = useCallback(
    (event: { preventDefault: () => void }) => {
      event.preventDefault()
      updateFilters({ keyword: keywordInput.trim() })
    },
    [updateFilters, keywordInput],
  )

  const handleClearFilters = useCallback(() => {
    setKeywordInput('')
    const next: AttractionFilters = {}
    setFilters(next)
    load(next)
  }, [load])

  const handlePageChange = useCallback(
    (page: number) => {
      updateFilters({ page })
    },
    [updateFilters],
  )

  // ---- 收藏切换 ----
  const handleToggleFavorite = useCallback(
    async (item: Attraction) => {
      setFavoritePendingIds(prev => new Set(prev).add(item.id))
      try {
        await toggleFavorite(item.id, item.isFavorite ?? false)
      }
      finally {
        setFavoritePendingIds((prev) => {
          const next = new Set(prev)
          next.delete(item.id)
          return next
        })
      }
    },
    [toggleFavorite],
  )

  const hasActiveFilters = useMemo(
    () => Boolean(filters.keyword || filters.city || filters.ticketType || filters.tag),
    [filters],
  )

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF7F0] pb-16">
      {/* 顶部 Hero 区域 */}
      <div className="border-b border-stone-200/80 bg-[#FAF7F0] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-3 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-2">
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>DESTINATIONS & ATTRACTIONS · 景点漫游志</span>
          </div>
          <h1
            className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight"
            id="attractions-title"
          >
            探索精选目的地与人文宝藏
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-stone-500">
            像翻阅旅行手账一样发现各地自然与人文胜地，收藏心动打卡点，随时让 AI 为你串联进路线。
          </p>
        </div>
      </div>

      {/* 主体工作台：双栏协同布局 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* 左侧主画廊区 (8 列)                                      */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 搜索与当前状态条 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-4 sm:p-5 shadow-sm space-y-3">
              <form className="flex items-center gap-2.5" onSubmit={handleSearchSubmit}>
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-800" />
                  <Input
                    className="h-11 rounded-2xl bg-white border-stone-200 pl-10 text-xs sm:text-sm text-stone-900 shadow-2xs placeholder:text-stone-400 focus-visible:ring-emerald-700"
                    id="attractions-keyword"
                    onChange={event => handleKeywordChange(event.target.value)}
                    placeholder="搜索景点名称、城市或标签（输入自动搜索）"
                    value={keywordInput}
                  />
                </div>
                <Button className="h-11 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-5 cursor-pointer text-xs sm:text-sm" type="submit">
                  搜索
                </Button>
              </form>

              {/* 筛选指示与统计 */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 text-xs">
                <div className="flex items-center gap-2 text-stone-500">
                  <span>
                    找到
                    {' '}
                    <strong className="font-serif text-emerald-800 text-sm">{total}</strong>
                    {' '}
                    处心动打卡点
                  </span>
                  {hasActiveFilters && (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                      已启用筛选
                    </span>
                  )}
                </div>

                {hasActiveFilters && (
                  <button
                    className="text-emerald-800 font-bold hover:underline text-xs cursor-pointer"
                    onClick={handleClearFilters}
                    type="button"
                  >
                    清空所有筛选
                  </button>
                )}
              </div>
            </div>

            {/* 卡片骨架屏 */}
            {loading && <AttractionCardSkeleton />}

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
                <p className="font-bold text-base text-stone-800">没有找到符合条件的景点手账</p>
                <p className="text-xs text-stone-400 max-w-sm">试试减少筛选条件、搜索其他城市，或在右侧切换主题标签</p>
                {hasActiveFilters && (
                  <Button className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold mt-2" onClick={handleClearFilters}>
                    清空筛选条件
                  </Button>
                )}
              </div>
            )}

            {/* 景点卡片网格 */}
            {!loading && !error && items.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const isFavoritePending = favoritePendingIds.has(item.id)
                    return (
                      <Link
                        className="group block"
                        href={`/attractions/${item.id}`}
                        key={item.id}
                      >
                        <article className="h-full overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/60 hover:shadow-xl flex flex-col">
                          <div className="relative h-[200px] w-full overflow-hidden shrink-0">
                            <Image
                              alt={`${item.name}，${item.city}景点封面`}
                              className="object-cover transition-transform duration-700 group-hover:scale-108"
                              fill
                              loading="lazy"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              src={item.coverImage}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/50 via-transparent to-transparent opacity-60" />
                            <button
                              className="absolute right-3 top-3 rounded-full p-2 bg-white/90 backdrop-blur-md text-stone-400 shadow-sm transition-all hover:scale-110 hover:text-red-500 cursor-pointer"
                              disabled={isFavoritePending}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleToggleFavorite(item)
                              }}
                              type="button"
                            >
                              <Heart
                                className={item.isFavorite ? 'fill-red-500 text-red-500' : ''}
                                size={16}
                              />
                            </button>
                            <Badge className="absolute left-3 top-3 bg-white/95 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-md rounded-full border border-stone-200">
                              📍
                              {' '}
                              {item.city}
                            </Badge>
                          </div>
                          <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                            <div>
                              <div className="mb-1.5 flex items-center justify-between gap-1">
                                <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors truncate">
                                  {item.name}
                                </h3>
                                <Badge
                                  className={`rounded-full text-[10px] font-bold shrink-0 ${
                                    item.ticketType === 'free'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {item.ticketType === 'free' ? '免费' : item.priceText || '收费'}
                                </Badge>
                              </div>
                              <p className="mb-3 text-xs leading-relaxed text-stone-500 line-clamp-2">
                                {item.summary}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1 pt-2.5 border-t border-stone-200/70">
                              {item.tags.slice(0, 3).map(tag => (
                                <span className="bg-stone-100/80 text-stone-600 text-[10px] font-medium rounded-md px-2 py-0.5" key={tag}>
                                  #
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </article>
                      </Link>
                    )
                  })}
                </div>

                {/* 分页组件 */}
                <Pagination
                  className="flex justify-center py-6"
                  onPageChange={handlePageChange}
                  page={filters.page || 1}
                  pageSize={PAGE_SIZE}
                  total={total}
                />
              </>
            )}
          </div>

          {/* ======================================================== */}
          {/* 右侧筛选与灵感看板 (4 列，桌面端常驻充实布局)             */}
          {/* ======================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* 模块 1: AI 路线编排与定制入口 */}
            <div className="rounded-3xl border border-emerald-700/20 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white p-5 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles className="w-4 h-4" />
                <span>AI 路线编排助手</span>
              </div>
              <h3 className="font-serif text-lg font-bold">
                选中心仪景点？
              </h3>
              <p className="text-xs text-emerald-100/80 leading-relaxed">
                无需手动计算导航顺序，AI 将为你规划最顺路的多日行程，包含沿途地道美食与门票预约建议。
              </p>
              <Link
                className="inline-flex items-center justify-between w-full rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 px-4 py-2.5 text-xs font-black shadow-sm transition-all hover:scale-[1.02]"
                href="/chat"
              >
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  <span>呼唤 AI 为我规划路线</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 模块 2: 城市快速筛选 */}
            {cities.length > 0 && (
              <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                    <span>探索目的地城市</span>
                  </span>
                  {filters.city && (
                    <button
                      className="text-[11px] text-emerald-800 font-bold hover:underline cursor-pointer"
                      onClick={() => updateFilters({ city: '' })}
                      type="button"
                    >
                      全部城市
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cities.map(city => (
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        filters.city === city
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-600 hover:text-emerald-800'
                      }`}
                      key={city}
                      onClick={() => updateFilters({ city: filters.city === city ? '' : city })}
                      type="button"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 模块 3: 门票类型筛选 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-serif text-xs font-bold text-stone-900">门票类型</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {ticketOptions.map(opt => (
                  <button
                    className={`py-2 px-1 rounded-2xl text-xs font-bold text-center transition-all border cursor-pointer ${
                      (filters.ticketType || '') === opt.value
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                    key={opt.value}
                    onClick={() => updateFilters({ ticketType: opt.value as '' | AttractionTicketType })}
                    type="button"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 模块 4: 精选主题标签 */}
            {tags.length > 0 && (
              <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    <span>精选主题标签</span>
                  </span>
                  {filters.tag && (
                    <button
                      className="text-[11px] text-amber-800 font-bold hover:underline cursor-pointer"
                      onClick={() => updateFilters({ tag: '' })}
                      type="button"
                    >
                      清除标签
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <button
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border cursor-pointer ${
                        filters.tag === tag
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-amber-500 hover:text-amber-900'
                      }`}
                      key={tag}
                      onClick={() => updateFilters({ tag: filters.tag === tag ? '' : tag })}
                      type="button"
                    >
                      #
                      {' '}
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 模块 5: 旅人打卡贴士便签 */}
            <div className="rounded-3xl border border-stone-200/90 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>游玩贴士</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                国家级博物馆与古城热门景区建议提前至少 3 天线上实名预约；山岳类景区出行前请务必确认索道与气象开放状态。
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
