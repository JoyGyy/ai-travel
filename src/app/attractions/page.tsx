'use client'

import { Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'

/**
 * 景点列表页面
 *
 * 支持关键词搜索、城市/收费类型/标签筛选与分页，
 * 每个景点卡片可收藏，并链接到详情页。
 */
import type { Attraction, AttractionFilters, AttractionTicketType } from '@/types/attraction'

import { fetchAttractions } from '@/api/attractions'
import { Pagination } from '@/components/Pagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAttractionFavorite } from '@/hooks/useAttractionFavorite'

import './style.css'

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
      setItems((prev) =>
        prev.map((current) => (current.id === attractionId ? { ...current, isFavorite } : current)),
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '景点加载失败')
    } finally {
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
      setFavoritePendingIds((prev) => new Set(prev).add(item.id))
      try {
        await toggleFavorite(item.id, item.isFavorite ?? false)
      } finally {
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
    <main aria-labelledby="attractions-title" className="attractions-page travel-page-shell">
      <section className="attractions-page__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="attractions-page__label">ATTRACTIONS</p>
        <h1 id="attractions-title">精选景点</h1>
        <p>像翻旅行票根一样发现目的地，收藏想去的景点，再让 AI 帮你串成路线。</p>
      </section>

      {/* ---- 筛选面板 ---- */}
      <section
        aria-labelledby="attractions-filter-title"
        className="attractions-page__filters travel-surface-card"
      >
        <div className="attractions-page__filters-header">
          <h2 id="attractions-filter-title">筛选景点</h2>
          {hasActiveFilters ? (
            <Button onClick={handleClearFilters} variant="link">
              清空筛选
            </Button>
          ) : null}
        </div>
        <form className="attractions-page__search" onSubmit={handleSearchSubmit}>
          <label htmlFor="attractions-keyword">搜索关键词</label>
          <div className="attractions-page__search-control">
            <Input
              className="flex-1"
              id="attractions-keyword"
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="搜索景点、城市或标签"
              value={keywordInput}
            />
            <Button type="submit">搜索</Button>
          </div>
        </form>
        {cities.length > 0 ? (
          <div aria-labelledby="attractions-city-filter" className="attractions-page__filter-group">
            <p id="attractions-city-filter">城市</p>
            <div className="attractions-page__filter-row">
              {cities.map((city) => (
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
        ) : null}
        <div className="attractions-page__select-group">
          <label htmlFor="attractions-ticket-type">收费类型</label>
          <select
            className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            id="attractions-ticket-type"
            onChange={(event) =>
              updateFilters({ ticketType: event.target.value as '' | AttractionTicketType })
            }
            value={filters.ticketType || ''}
          >
            {ticketOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {tags.length > 0 ? (
          <div aria-labelledby="attractions-tag-filter" className="attractions-page__filter-group">
            <p id="attractions-tag-filter">标签</p>
            <div className="attractions-page__filter-row">
              {tags.map((tag) => (
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
        ) : null}
        <p aria-live="polite" className="attractions-page__result-status">
          {loading ? '正在应用筛选...' : `共找到 ${total} 个景点`}
        </p>
      </section>

      {loading ? (
        <div aria-live="polite" className="attractions-page__loading" role="status">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span>加载景点中...</span>
        </div>
      ) : null}
      {!loading && error ? (
        <div className="attractions-page__error travel-surface-card" role="alert">
          <span>{error}</span>
          <Button onClick={() => load(filters)}>重试</Button>
        </div>
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <div className="attractions-page__empty travel-surface-card">
          <div className="text-center py-8 text-muted-foreground">
            <p>没有找到符合筛选条件的景点</p>
          </div>
          {hasActiveFilters ? <Button onClick={handleClearFilters}>清空筛选</Button> : null}
        </div>
      ) : null}

      {/* ---- 景点卡片网格 ---- */}
      {!loading && !error && items.length > 0 ? (
        <>
          <section aria-label="景点列表" className="attractions-page__grid">
            {items.map((item) => {
              const isFavoritePending = favoritePendingIds.has(item.id)
              return (
                <Link
                  aria-label={`查看${item.name}详情`}
                  className="attractions-page__card-link"
                  href={`/attractions/${item.id}`}
                  key={item.id}
                >
                  <article className="attractions-page__card travel-surface-card travel-ticket-edge">
                    <Image
                      alt={`${item.name}，${item.city}景点封面`}
                      className="attractions-page__cover"
                      height={250}
                      loading="lazy"
                      src={item.coverImage}
                      unoptimized
                      width={400}
                    />
                    <div className="attractions-page__card-body">
                      <div className="attractions-page__card-title-row">
                        <h2>{item.name}</h2>
                        <button
                          aria-label={`${item.isFavorite ? '取消收藏' : '收藏'}${item.name}`}
                          aria-pressed={!!item.isFavorite}
                          className="attractions-page__favorite"
                          disabled={isFavoritePending}
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleToggleFavorite(item)
                          }}
                          type="button"
                        >
                          {item.isFavorite ? (
                            <Heart aria-hidden="true" />
                          ) : (
                            <Heart aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      <p>{item.summary}</p>
                      <div className="attractions-page__meta">
                        <Badge
                          className={`travel-tag ${item.ticketType === 'free' ? 'travel-tag--free' : 'travel-tag--paid'}`}
                        >
                          {item.ticketType === 'free' ? '免费' : '收费'}
                        </Badge>
                        <span>{item.city}</span>
                        <span>{item.priceText}</span>
                      </div>
                      <div className="attractions-page__tags">
                        {item.tags.map((tag) => (
                          <Badge className="travel-tag travel-tag--info" key={tag}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <span aria-hidden="true" className="attractions-page__detail-link">
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
            className="attractions-page__pagination"
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
