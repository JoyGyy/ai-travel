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
    <main aria-labelledby="attractions-title" className="travel-page-shell">
      <section className="travel-page-hero travel-ticket-edge travel-route-line">
        <p className="mb-2.5 w-fit rounded-full bg-primary/10 px-2.5 py-1.5 text-[12px] font-black tracking-[0.14em] text-primary-strong">
          ATTRACTIONS
        </p>
        <h1
          className="mb-2 font-display text-[clamp(30px,5vw,52px)] leading-[1.05] text-travel-ocean"
          id="attractions-title"
        >
          精选景点
        </h1>
        <p className="max-w-[640px] text-base leading-relaxed text-stone-900/72">
          像翻旅行票根一样发现目的地，收藏想去的景点，再让 AI 帮你串成路线。
        </p>
      </section>

      {/* ---- 筛选面板 ---- */}
      <section
        aria-labelledby="attractions-filter-title"
        className="mx-auto max-w-[1180px] rounded-xl p-[clamp(16px,3vw,22px)]"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-travel-ocean" id="attractions-filter-title">
            筛选景点
          </h2>
          {hasActiveFilters
            ? (
                <Button onClick={handleClearFilters} variant="link">
                  清空筛选
                </Button>
              )
            : null}
        </div>
        <form className="mt-3.5 grid gap-2" onSubmit={handleSearchSubmit}>
          <label
            className="text-[13px] font-extrabold text-stone-900/72"
            htmlFor="attractions-keyword"
          >
            搜索关键词
          </label>
          <div className="flex items-center gap-2.5">
            <Input
              className="flex-1"
              id="attractions-keyword"
              onChange={event => handleKeywordChange(event.target.value)}
              placeholder="搜索景点、城市或标签（输入自动搜索）"
              value={keywordInput}
            />
            <Button type="submit">搜索</Button>
          </div>
        </form>
        {cities.length > 0
          ? (
              <div aria-labelledby="attractions-city-filter" className="mt-3.5 grid gap-2">
                <p
                  className="text-[13px] font-extrabold text-stone-900/72"
                  id="attractions-city-filter"
                >
                  城市
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {cities.map(city => (
                    <Button
                      aria-pressed={filters.city === city}
                      key={city}
                      onClick={() => updateFilters({ city: filters.city === city ? '' : city })}
                      variant={filters.city === city ? 'default' : 'outline'}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            )
          : null}
        <div className="mt-3.5 grid gap-2">
          <label
            className="text-[13px] font-extrabold text-stone-900/72"
            htmlFor="attractions-ticket-type"
          >
            收费类型
          </label>
          <select
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
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
              <div aria-labelledby="attractions-tag-filter" className="mt-3.5 grid gap-2">
                <p className="text-[13px] font-extrabold text-stone-900/72" id="attractions-tag-filter">
                  标签
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map(tag => (
                    <Button
                      aria-pressed={filters.tag === tag}
                      key={tag}
                      onClick={() => updateFilters({ tag: filters.tag === tag ? '' : tag })}
                      variant={filters.tag === tag ? 'default' : 'outline'}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )
          : null}
        <p aria-live="polite" className="mt-2 text-[13px] text-travel-muted">
          {loading ? '正在应用筛选...' : `共找到 ${total} 个景点`}
        </p>
      </section>

      {loading && <AttractionCardSkeleton />}
      {!loading && error
        ? (
            <div className="flex items-center justify-between rounded-xl p-6" role="alert">
              <span>{error}</span>
              <Button onClick={() => load(filters)}>重试</Button>
            </div>
          )
        : null}
      {!loading && !error && items.length === 0
        ? (
            <div className="flex flex-col items-center gap-3 rounded-xl p-6">
              <div className="py-8 text-center text-muted-foreground">
                <p>没有找到符合筛选条件的景点</p>
              </div>
              {hasActiveFilters ? <Button onClick={handleClearFilters}>清空筛选</Button> : null}
            </div>
          )
        : null}

      {/* ---- 景点卡片网格 ---- */}
      {!loading && !error && items.length > 0 ? (
        <>
          <section
            aria-label="景点列表"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((item) => {
              const isFavoritePending = favoritePendingIds.has(item.id)
              return (
                <Link
                  aria-label={`查看${item.name}详情`}
                  className="group block"
                  href={`/attractions/${item.id}`}
                  key={item.id}
                >
                  <article className="travel-surface-card travel-ticket-edge overflow-hidden">
                    <Image
                      alt={`${item.name}，${item.city}景点封面`}
                      className="h-[250px] w-full object-cover"
                      height={250}
                      loading="lazy"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={item.coverImage}
                      width={400}
                    />
                    <div className="p-5">
                      <div className="mb-2 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-travel-ink">{item.name}</h2>
                        <button
                          aria-label={`${item.isFavorite ? '取消收藏' : '收藏'}${item.name}`}
                          aria-pressed={!!item.isFavorite}
                          className="rounded-full p-2 text-travel-muted transition-colors hover:text-primary"
                          disabled={isFavoritePending}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleFavorite(item)
                          }}
                          type="button"
                        >
                          <Heart
                            aria-hidden="true"
                            className={item.isFavorite ? 'fill-primary text-primary' : ''}
                          />
                        </button>
                      </div>
                      <p className="mb-3 text-sm text-travel-muted">{item.summary}</p>
                      <div className="mb-3 flex items-center gap-2">
                        <Badge
                          className={`travel-tag ${item.ticketType === 'free' ? 'travel-tag--free' : 'travel-tag--paid'}`}
                        >
                          {item.ticketType === 'free' ? '免费' : '收费'}
                        </Badge>
                        <span className="text-sm text-travel-ink">{item.city}</span>
                        <span className="text-sm text-travel-muted">{item.priceText}</span>
                      </div>
                      <div className="mb-4 flex flex-wrap gap-1.5">
                        {item.tags.map(tag => (
                          <Badge className="travel-tag travel-tag--info" key={tag}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span
                        aria-hidden="true"
                        className="text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        查看详情
                      </span>
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
