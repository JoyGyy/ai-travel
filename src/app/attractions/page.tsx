'use client'

/**
 * 景点列表页面
 *
 * 支持关键词搜索、城市/收费类型/标签筛选与分页，
 * 每个景点卡片可收藏，并链接到详情页。
 * 输入关键词后防抖 300ms 自动搜索，减少 API 请求。
 */
import type { Attraction, AttractionFilters, AttractionTicketType } from '@/types/attraction'
import { Heart } from 'lucide-react'
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
  { label: '全部', value: '' },
  { label: '免费', value: 'free' },

  { label: '收费', value: 'paid' },
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

  const PAGE_SIZE = 12

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
      // 防抖搜索：空关键词时立即清除，否则防抖 300ms
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
      // 手动提交时取消防抖，立即搜索
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
    <main className="travel-page-shell gap-6">
      <section className="relative overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-6 sm:p-8 shadow-sm">
        <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
          DESTINATIONS & ATTRACTIONS · 景点漫游志
        </p>
        <h1
          className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight"
          id="attractions-title"
        >
          探索精选景点
        </h1>
        <p className="mt-2 max-w-[640px] text-xs sm:text-sm leading-relaxed text-stone-500">
          像翻阅旅行手账一样发现各地自然与人文宝藏，收藏心动目的地，随时让 AI 编排进你的路线。
        </p>
      </section>

      {/* ---- 筛选面板 ---- */}
      <section
        className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-6 shadow-sm"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-serif text-base font-bold text-stone-900" id="attractions-filter-title">
            筛选景点手账
          </h2>
          {hasActiveFilters
            ? (
                <Button className="text-emerald-800 font-bold" onClick={handleClearFilters} variant="link">
                  清空所有筛选
                </Button>
              )
            : null}
        </div>
        <form className="grid gap-2" onSubmit={handleSearchSubmit}>
          <label
            className="text-xs font-bold text-stone-700"
            htmlFor="attractions-keyword"
          >
            搜索关键词
          </label>
          <div className="flex items-center gap-2.5">
            <Input
              className="flex-1 rounded-2xl bg-white border-stone-200 text-stone-900 shadow-2xs"
              id="attractions-keyword"
              onChange={event => handleKeywordChange(event.target.value)}
              placeholder="搜索景点名称、城市或标签（输入自动搜索）"
              value={keywordInput}
            />
            <Button className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer" type="submit">搜索</Button>
          </div>
        </form>
        {cities.length > 0
          ? (
              <div className="mt-4 grid gap-2">
                <p
                  className="text-xs font-bold text-stone-700"
                  id="attractions-city-filter"
                >
                  探索城市
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {cities.map(city => (
                    <Button
                      className={`rounded-full px-3.5 py-1 text-xs font-bold cursor-pointer ${filters.city === city ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'}`}
                      key={city}
                      onClick={() => updateFilters({ city: filters.city === city ? '' : city })}
                      size="sm"
                      variant={filters.city === city ? 'default' : 'outline'}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            )
          : null}
        <div className="mt-4 grid gap-2">
          <label
            className="text-xs font-bold text-stone-700"
            htmlFor="attractions-ticket-type"
          >
            门票类型
          </label>
          <select
            className="flex h-10 w-full max-w-[240px] rounded-2xl border border-stone-200 bg-white px-3 py-2 text-xs font-bold text-stone-800 shadow-2xs"
            id="attractions-ticket-type"
            onChange={event =>
              updateFilters({ ticketType: event.target.value as '' | AttractionTicketType })}
            value={filters.ticketType || ''}
          >
            {ticketOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {tags.length > 0
          ? (
              <div className="mt-4 grid gap-2">
                <p className="text-xs font-bold text-stone-700" id="attractions-tag-filter">
                  主题标签
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map(tag => (
                    <Button
                      className={`rounded-full px-3 py-1 text-xs font-bold cursor-pointer ${filters.tag === tag ? 'bg-amber-600 text-white hover:bg-amber-700' : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'}`}
                      key={tag}
                      onClick={() => updateFilters({ tag: filters.tag === tag ? '' : tag })}
                      size="sm"
                      variant={filters.tag === tag ? 'default' : 'outline'}
                    >
                      #
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )
          : null}
        <p className="mt-3 text-xs text-stone-400">
          {loading ? '正在检索景点数据...' : `共找到 ${total} 个推荐目的地`}
        </p>
      </section>

      {loading && <AttractionCardSkeleton />}
      {!loading && error
        ? (
            <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 font-bold">
              <span>{error}</span>
              <Button className="rounded-xl bg-red-600 hover:bg-red-700 text-white" onClick={() => load(filters)}>重试</Button>
            </div>
          )
        : null}
      {!loading && !error && items.length === 0
        ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-8">
              <div className="py-6 text-center text-stone-500">
                <p className="font-bold text-base">没有找到符合筛选条件的景点手账</p>
                <p className="text-xs text-stone-400 mt-1">试试减少筛选条件或搜索其他城市</p>
              </div>
              {hasActiveFilters ? <Button className="rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white" onClick={handleClearFilters}>清空筛选</Button> : null}
            </div>
          )
        : null}

      {/* ---- 景点卡片网格 ---- */}
      {!loading && !error && items.length > 0 ? (
        <>
          <section
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item) => {
              const isFavoritePending = favoritePendingIds.has(item.id)
              return (
                <Link
                  className="group block"
                  href={`/attractions/${item.id}`}
                  key={item.id}
                >
                  <article className="overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-700/60 hover:shadow-xl">
                    <div className="relative h-[220px] w-full overflow-hidden">
                      <Image
                        alt={`${item.name}，${item.city}景点封面`}
                        className="object-cover transition-transform duration-700 group-hover:scale-108"
                        fill
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        src={item.coverImage}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent opacity-60" />
                      <button
                        className="absolute right-3.5 top-3.5 rounded-full p-2 bg-white/90 backdrop-blur-md text-stone-400 shadow-sm transition-all hover:scale-110 hover:text-red-500 cursor-pointer"
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
                          size={18}
                        />
                      </button>
                      <Badge className="absolute left-3.5 top-3.5 bg-white/95 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur-md rounded-full border border-stone-200">
                        🌿
                        {' '}
                        {item.city}
                      </Badge>
                    </div>
                    <div className="p-5">
                      <div className="mb-1 flex items-center justify-between">
                        <h2 className="font-serif text-base font-bold text-stone-900 group-hover:text-emerald-800 transition-colors">{item.name}</h2>
                        <Badge
                          className={`rounded-full text-[11px] font-bold ${item.ticketType === 'free' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}
                        >
                          {item.ticketType === 'free' ? '免费开放' : item.priceText || '收费'}
                        </Badge>
                      </div>
                      <p className="mb-3 text-xs leading-relaxed text-stone-500 line-clamp-2">{item.summary}</p>
                      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-stone-200/70">
                        {item.tags.map(tag => (
                          <Badge className="bg-stone-100/80 text-stone-600 border border-stone-200 text-[10px] font-medium rounded-full px-2.5 py-0.5" key={tag}>
                            #
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </article>
                </Link>
              )
            })}
          </section>
          {/* ---- 分页 ---- */}
          <Pagination
            className="flex justify-center py-6"
            onPageChange={handlePageChange}
            page={filters.page || 1}
            pageSize={PAGE_SIZE}
            total={total}
          />
        </>
      ) : null}
    </main>
  )
}
