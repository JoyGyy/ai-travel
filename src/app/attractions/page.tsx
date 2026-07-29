'use client'

/**
 * 景点列表页面
 *
 * 支持关键词搜索、城市/收费类型/标签筛选与分页，
 * 每个景点卡片可收藏，并链接到详情页。
 */
import type { Attraction, AttractionFilters, AttractionTicketType } from '@/types/attraction'

import { Heart, Search } from 'lucide-react'
import Link from 'next/link'

import { useAppToast } from '@/hooks/useAppToast'
import { useCallback, useEffect, useState } from 'react'

import { favoriteAttraction, fetchAttractions, unfavoriteAttraction } from '@/api/attractions'

import './style.css'

const ticketOptions = [
  { value: '', label: '全部' },
  { value: 'free', label: '免费' },
  { value: 'paid', label: '收费' },
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
  const toast = useAppToast()

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
  function updateFilters(patch: AttractionFilters) {
    const next = { ...filters, ...patch, page: patch.page || 1 }
    setFilters(next)
    load(next)
  }

  function handleSearchSubmit(event: { preventDefault: () => void }) {
    event.preventDefault()
    updateFilters({ keyword: keywordInput.trim() })
  }

  function handleClearFilters() {
    setKeywordInput('')
    const next: AttractionFilters = {}
    setFilters(next)
    load(next)
  }

  function handlePageChange(page: number) {
    updateFilters({ page })
  }

  // ---- 收藏切换 ----
  async function toggleFavorite(item: Attraction) {
    setFavoritePendingIds(prev => new Set(prev).add(item.id))
    try {
      const result = item.isFavorite
        ? await unfavoriteAttraction(item.id)
        : await favoriteAttraction(item.id)
      setItems(prev => prev.map(current => current.id === item.id ? { ...current, isFavorite: result.isFavorite } : current))
      toast.success(result.isFavorite ? '已收藏' : '已取消收藏')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '收藏操作失败')
    }
    finally {
      setFavoritePendingIds((prev) => {
        const next = new Set(prev)
        next.delete(item.id)
        return next
      })
    }
  }

  const hasActiveFilters = Boolean(filters.keyword || filters.city || filters.ticketType || filters.tag)

  return (
    <main className="attractions-page travel-page-shell" aria-labelledby="attractions-title">
      <section className="attractions-page__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="attractions-page__label">ATTRACTIONS</p>
        <h1 id="attractions-title">精选景点</h1>
        <p>像翻旅行票根一样发现目的地，收藏想去的景点，再让 AI 帮你串成路线。</p>
      </section>

      {/* ---- 筛选面板 ---- */}
      <section className="attractions-page__filters travel-surface-card" aria-labelledby="attractions-filter-title">
        <div className="attractions-page__filters-header">
          <h2 id="attractions-filter-title">筛选景点</h2>
          {hasActiveFilters ? <Button type="link" onClick={handleClearFilters}>清空筛选</Button> : null}
        </div>
        <form className="attractions-page__search" onSubmit={handleSearchSubmit}>
          <label htmlFor="attractions-keyword">搜索关键词</label>
          <div className="attractions-page__search-control">
            <Input
              id="attractions-keyword"
              allowClear
              prefix={<Search aria-hidden="true" />}
              placeholder="搜索景点、城市或标签"
              value={keywordInput}
              onChange={event => setKeywordInput(event.target.value)}
            />
            <Button type="primary" htmlType="submit">搜索</Button>
          </div>
        </form>
        {cities.length > 0
          ? (
              <div className="attractions-page__filter-group" aria-labelledby="attractions-city-filter">
                <p id="attractions-city-filter">城市</p>
                <div className="attractions-page__filter-row">
                  {cities.map(city => (
                    <Button
                      key={city}
                      type={filters.city === city ? 'primary' : 'default'}
                      aria-pressed={filters.city === city}
                      onClick={() => updateFilters({ city: filters.city === city ? '' : city })}
                    >
                      {city}
                    </Button>
                  ))}
                </div>
              </div>
            )
          : null}
        <div className="attractions-page__select-group">
          <label htmlFor="attractions-ticket-type">收费类型</label>
          <Select
            id="attractions-ticket-type"
            value={filters.ticketType || ''}
            options={ticketOptions}
            onChange={ticketType => updateFilters({ ticketType: ticketType as AttractionTicketType | '' })}
          />
        </div>
        {tags.length > 0
          ? (
              <div className="attractions-page__filter-group" aria-labelledby="attractions-tag-filter">
                <p id="attractions-tag-filter">标签</p>
                <div className="attractions-page__filter-row">
                  {tags.map(tag => (
                    <Button
                      key={tag}
                      type={filters.tag === tag ? 'primary' : 'default'}
                      aria-pressed={filters.tag === tag}
                      onClick={() => updateFilters({ tag: filters.tag === tag ? '' : tag })}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )
          : null}
        <p className="attractions-page__result-status" aria-live="polite">
          {loading ? '正在应用筛选...' : `共找到 ${total} 个景点`}
        </p>
      </section>

      {loading
        ? (
            <div className="attractions-page__loading" role="status" aria-live="polite">
              <Spin />
              <span>加载景点中...</span>
            </div>
          )
        : null}
      {!loading && error
        ? (
            <div className="attractions-page__error travel-surface-card" role="alert">
              <span>{error}</span>
              <Button onClick={() => load(filters)}>重试</Button>
            </div>
          )
        : null}
      {!loading && !error && items.length === 0
        ? (
            <div className="attractions-page__empty travel-surface-card">
              <Empty description="没有找到符合筛选条件的景点" />
              {hasActiveFilters ? <Button type="primary" onClick={handleClearFilters}>清空筛选</Button> : null}
            </div>
          )
        : null}

      {/* ---- 景点卡片网格 ---- */}
      {!loading && !error && items.length > 0
        ? (
            <>
              <section className="attractions-page__grid" aria-label="景点列表">
                {items.map((item) => {
                  const isFavoritePending = favoritePendingIds.has(item.id)
                  return (
                    <Link key={item.id} href={`/attractions/${item.id}`} className="attractions-page__card-link" aria-label={`查看${item.name}详情`}>
                      <article className="attractions-page__card travel-surface-card travel-ticket-edge">
                        <img
                          src={item.coverImage}
                          alt={`${item.name}，${item.city}景点封面`}
                          className="attractions-page__cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            const target = e.currentTarget
                            target.onerror = null
                            target.style.background = 'linear-gradient(135deg, var(--travel-primary) 0%, var(--travel-ocean) 100%)'
                            target.src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif">📷</text></svg>')}`
                          }}
                        />
                        <div className="attractions-page__card-body">
                          <div className="attractions-page__card-title-row">
                            <h2>{item.name}</h2>
                            <button
                              type="button"
                              aria-label={`${item.isFavorite ? '取消收藏' : '收藏'}${item.name}`}
                              aria-pressed={Boolean(item.isFavorite)}
                              disabled={isFavoritePending}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                toggleFavorite(item)
                              }}
                              className="attractions-page__favorite"
                            >
                              {item.isFavorite ? <Heart aria-hidden="true" /> : <Heart aria-hidden="true" />}
                            </button>
                          </div>
                          <p>{item.summary}</p>
                          <div className="attractions-page__meta">
                            <Tag className={`travel-tag ${item.ticketType === 'free' ? 'travel-tag--free' : 'travel-tag--paid'}`}>{item.ticketType === 'free' ? '免费' : '收费'}</Tag>
                            <span>{item.city}</span>
                            <span>{item.priceText}</span>
                          </div>
                          <div className="attractions-page__tags">
                            {item.tags.map(tag => <Tag key={tag} className="travel-tag travel-tag--info">{tag}</Tag>)}
                          </div>
                          <span className="attractions-page__detail-link" aria-hidden="true">查看详情</span>
                        </div>
                      </article>
                    </Link>
                  )
                })}
              </section>
              {/* ---- 分页 ---- */}
              {total > PAGE_SIZE && (
                <div className="attractions-page__pagination">
                  <Pagination
                    current={filters.page || 1}
                    total={total}
                    pageSize={PAGE_SIZE}
                    showSizeChanger={false}
                    showTotal={t => `共 ${t} 个景点`}
                    onChange={handlePageChange}
                  />
                </div>
              )}
            </>
          )
        : null}
    </main>
  )
}
