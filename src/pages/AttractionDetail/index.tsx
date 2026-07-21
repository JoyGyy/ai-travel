/**
 * 景点详情页面
 * 展示景点详细信息、购票入口和 AI 规划入口
 */
import type { Attraction } from '@/types/attraction'
import { ArrowLeftOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons'
import { Button, message, Spin, Tag } from 'antd'
import { useEffect, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'

import { favoriteAttraction, fetchAttractionDetail, unfavoriteAttraction } from '@/api/attractions'

import './style.css'

/** 生成搜索 URL 降级地址（无真实购票链接时使用） */
function buildSearchUrl(platform: 'ctrip' | 'fliggy' | 'ly', attraction: Attraction) {
  const keyword = encodeURIComponent(`${attraction.city} ${attraction.name} 门票`)
  if (platform === 'ctrip')
    return `https://you.ctrip.com/searchsite/?query=${keyword}`
  if (platform === 'fliggy')
    return `https://s.taobao.com/search?q=${keyword}`
  return `https://www.ly.com/scenery/scenerysearchlist_${keyword}.html`
}

/** 构建购票链接列表，优先使用真实链接，缺失时降级为搜索 URL */
function buildBookingLinks(attraction: Attraction) {
  return [
    { key: 'ctrip' as const, label: '携程', href: attraction.bookingLinks.ctrip || buildSearchUrl('ctrip', attraction) },
    { key: 'fliggy' as const, label: '飞猪', href: attraction.bookingLinks.fliggy || buildSearchUrl('fliggy', attraction) },
    { key: 'ly' as const, label: '同程', href: attraction.bookingLinks.ly || buildSearchUrl('ly', attraction) },
  ]
}

export default function AttractionDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [attraction, setAttraction] = useState<Attraction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [favoritePending, setFavoritePending] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  const [msg, contextHolder] = message.useMessage()

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchAttractionDetail(id)
        if (!cancelled)
          setAttraction({ ...data.attraction, isFavorite: data.isFavorite })
      }
      catch (err: unknown) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : '景点加载失败')
      }
      finally {
        if (!cancelled)
          setLoading(false)
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [id, reloadKey])

  /** 切换收藏状态 */
  async function toggleFavorite() {
    if (!attraction)
      return
    setFavoritePending(true)
    try {
      const result = attraction.isFavorite
        ? await unfavoriteAttraction(attraction.id)
        : await favoriteAttraction(attraction.id)
      setAttraction({ ...attraction, isFavorite: result.isFavorite })
      msg.success(result.isFavorite ? '已收藏' : '已取消收藏')
    }
    catch (err: unknown) {
      msg.error(err instanceof Error ? err.message : '收藏操作失败')
    }
    finally {
      setFavoritePending(false)
    }
  }

  if (loading) {
    return (
      <main className="attraction-detail travel-page-shell" aria-labelledby="attraction-loading-title">
        {contextHolder}
        <div className="attraction-detail__state travel-surface-card" role="status" aria-live="polite">
          <Spin />
          <h1 id="attraction-loading-title">加载景点详情中...</h1>
          <p>正在取出这张目的地票根。</p>
        </div>
      </main>
    )
  }
  if (error || !attraction) {
    return (
      <main className="attraction-detail travel-page-shell" aria-labelledby="attraction-error-title">
        {contextHolder}
        <div className="attraction-detail__state travel-surface-card" role="alert">
          <h1 id="attraction-error-title">景点暂时无法打开</h1>
          <p>{error || '景点不存在或已下架'}</p>
          <div className="attraction-detail__state-actions">
            <Button type="primary" onClick={() => setReloadKey(prev => prev + 1)}>重试</Button>
            <Button onClick={() => navigate('/attractions')}>返回景点列表</Button>
          </div>
        </div>
      </main>
    )
  }

  const prompt = encodeURIComponent(`帮我规划一个包含${attraction.city}${attraction.name}的旅行行程`)
  const ticketTypeClass = attraction.ticketType === 'free' ? 'travel-tag--free' : 'travel-tag--paid'

  return (
    <main className="attraction-detail travel-page-shell" aria-labelledby="attraction-detail-title">
      {contextHolder}
      <button type="button" className="attraction-detail__back" onClick={() => navigate(-1)}>
        <ArrowLeftOutlined aria-hidden="true" />
        <span>返回</span>
      </button>
      <section className="attraction-detail__hero travel-surface-card travel-ticket-edge travel-route-line">
        <img src={attraction.coverImage} alt={`${attraction.name}，${attraction.city}景点封面`} loading="eager" decoding="async" />
        <div className="attraction-detail__hero-content">
          <p className="attraction-detail__city">{attraction.city}</p>
          <h1 id="attraction-detail-title">{attraction.name}</h1>
          <p className="attraction-detail__summary">{attraction.summary}</p>
          <div className="attraction-detail__tags">
            <Tag className={`travel-tag ${ticketTypeClass}`}>{attraction.ticketType === 'free' ? '免费' : '收费'}</Tag>
            <Tag className="travel-tag travel-tag--warning">{attraction.priceText}</Tag>
            {attraction.tags.map(tag => <Tag key={tag} className="travel-tag travel-tag--info">{tag}</Tag>)}
          </div>
          <div className="attraction-detail__hero-actions">
            <Button
              onClick={toggleFavorite}
              aria-label={`${attraction.isFavorite ? '取消收藏' : '收藏'}${attraction.name}`}
              aria-pressed={Boolean(attraction.isFavorite)}
              disabled={favoritePending}
              loading={favoritePending}
              icon={attraction.isFavorite ? <HeartFilled aria-hidden="true" /> : <HeartOutlined aria-hidden="true" />}
            >
              {attraction.isFavorite ? '已收藏' : '收藏'}
            </Button>
            <Link className="attraction-detail__primary-action" to={`/chat?prompt=${prompt}`}>让 AI 规划这站</Link>
          </div>
        </div>
      </section>

      <section className="attraction-detail__section travel-surface-card">
        <h2>景点介绍</h2>
        <p>{attraction.description}</p>
      </section>
      <section className="attraction-detail__section travel-surface-card">
        <h2>实用信息</h2>
        <dl className="attraction-detail__info-grid">
          <div>
            <dt>地址</dt>
            <dd>{attraction.address}</dd>
          </div>
          <div>
            <dt>开放时间</dt>
            <dd>{attraction.openingHours}</dd>
          </div>
          <div>
            <dt>建议游玩</dt>
            <dd>{attraction.recommendedDuration}</dd>
          </div>
          <div>
            <dt>票价</dt>
            <dd>{attraction.priceText}</dd>
          </div>
        </dl>
      </section>
      <section className="attraction-detail__section travel-surface-card">
        <h2>游玩亮点</h2>
        <ul className="attraction-detail__list">{attraction.highlights.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="attraction-detail__section travel-surface-card">
        <h2>注意事项</h2>
        <ul className="attraction-detail__list">{attraction.tips.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="attraction-detail__section travel-surface-card">
        <h2>购票入口</h2>
        <p className="attraction-detail__notice">价格、库存和开放时间以第三方平台及景区官方公告为准。</p>
        <div className="attraction-detail__booking">
          {buildBookingLinks(attraction).map(link => (
            <a
              key={link.key}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`去${link.label}查看${attraction.name}门票，打开新窗口`}
            >
              去
              {link.label}
              查看
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}
