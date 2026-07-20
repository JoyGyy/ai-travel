import type { Attraction, AttractionFilters, AttractionTicketType } from '@/types/attraction'
import { HeartFilled, HeartOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Empty, Input, Select, Spin, Tag, message } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { favoriteAttraction, fetchAttractions, unfavoriteAttraction } from '@/api/attractions'
import './style.css'

export default function Attractions() {
  const [items, setItems] = useState<Attraction[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [filters, setFilters] = useState<AttractionFilters>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, contextHolder] = message.useMessage()

  const load = useCallback(async (nextFilters: AttractionFilters) => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchAttractions(nextFilters)
      setItems(data.items)
      setCities(data.cities)
      setTags(data.tags)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : '景点加载失败')
    }
    finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect -- 初始化数据加载是合法的 effect 用法
  useEffect(() => { load({}) }, [load])

  function updateFilters(patch: AttractionFilters) {
    const next = { ...filters, ...patch }
    setFilters(next)
    load(next)
  }

  async function toggleFavorite(item: Attraction) {
    try {
      const result = item.isFavorite
        ? await unfavoriteAttraction(item.id)
        : await favoriteAttraction(item.id)
      setItems(prev => prev.map(current => current.id === item.id ? { ...current, isFavorite: result.isFavorite } : current))
      msg.success(result.isFavorite ? '已收藏' : '已取消收藏')
    }
    catch (err) {
      msg.error(err instanceof Error ? err.message : '收藏操作失败')
    }
  }

  const ticketOptions = useMemo(() => [
    { value: '', label: '全部' },
    { value: 'free', label: '免费' },
    { value: 'paid', label: '收费' },
  ], [])

  return (
    <main className="attractions-page" aria-labelledby="attractions-title">
      {contextHolder}
      <section className="attractions-page__hero">
        <p className="attractions-page__label">ATTRACTIONS</p>
        <h1 id="attractions-title">精选景点</h1>
        <p>发现热门目的地，收藏想去的景点，并跳转第三方平台购票。</p>
      </section>

      <section className="attractions-page__filters" aria-label="景点筛选">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="搜索景点、城市或标签"
          onPressEnter={event => updateFilters({ keyword: event.currentTarget.value.trim() })}
          onChange={event => { if (!event.target.value) updateFilters({ keyword: '' }) }}
        />
        <div className="attractions-page__filter-row">
          {cities.map(city => (
            <Button key={city} type={filters.city === city ? 'primary' : 'default'} onClick={() => updateFilters({ city: filters.city === city ? '' : city })}>{city}</Button>
          ))}
        </div>
        <Select aria-label="收费类型" value={filters.ticketType || ''} options={ticketOptions} onChange={ticketType => updateFilters({ ticketType: ticketType as AttractionTicketType | '' })} />
        <div className="attractions-page__filter-row">
          {tags.map(tag => (
            <Button key={tag} type={filters.tag === tag ? 'primary' : 'default'} onClick={() => updateFilters({ tag: filters.tag === tag ? '' : tag })}>{tag}</Button>
          ))}
        </div>
      </section>

      {loading ? <div className="attractions-page__loading"><Spin /> 加载景点中...</div> : null}
      {!loading && error ? <div className="attractions-page__error" role="alert"><span>{error}</span><Button onClick={() => load(filters)}>重试</Button></div> : null}
      {!loading && !error && items.length === 0 ? <Empty description="暂无符合条件的景点" /> : null}

      {!loading && !error && items.length > 0 ? (
        <section className="attractions-page__grid" aria-label="景点列表">
          {items.map(item => (
            <article key={item.id} className="attractions-page__card">
              <img src={item.coverImage} alt="" className="attractions-page__cover" />
              <div className="attractions-page__card-body">
                <div className="attractions-page__card-title-row">
                  <h2>{item.name}</h2>
                  <button type="button" aria-label={`${item.isFavorite ? '取消收藏' : '收藏'}${item.name}`} onClick={() => toggleFavorite(item)} className="attractions-page__favorite">
                    {item.isFavorite ? <HeartFilled /> : <HeartOutlined />}
                  </button>
                </div>
                <p>{item.summary}</p>
                <div className="attractions-page__meta">
                  <Tag color={item.ticketType === 'free' ? 'green' : 'orange'}>{item.ticketType === 'free' ? '免费' : '收费'}</Tag>
                  <span>{item.city}</span>
                  <span>{item.priceText}</span>
                </div>
                <div className="attractions-page__tags">{item.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}</div>
                <Link className="attractions-page__detail-link" to={`/attractions/${item.id}`}>查看详情</Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </main>
  )
}
