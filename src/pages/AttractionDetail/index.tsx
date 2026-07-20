import { ArrowLeftOutlined, HeartFilled, HeartOutlined } from '@ant-design/icons'
import { Button, message, Spin, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

/**
 * 景点详情页面
 * 展示景点详细信息、购票入口和 AI 规划入口
 */
import type { Attraction } from '@/types/attraction'

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
      catch (err) {
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
  }, [id])

  /** 切换收藏状态 */
  async function toggleFavorite() {
    if (!attraction)
      return
    try {
      const result = attraction.isFavorite
        ? await unfavoriteAttraction(attraction.id)
        : await favoriteAttraction(attraction.id)
      setAttraction({ ...attraction, isFavorite: result.isFavorite })
      msg.success(result.isFavorite ? '已收藏' : '已取消收藏')
    }
    catch (err) {
      msg.error(err instanceof Error ? err.message : '收藏操作失败')
    }
  }

  if (loading) {
    return (
      <main className="attraction-detail">
        <Spin />
        {' '}
        加载景点详情中...
      </main>
    )
  }
  if (error || !attraction) {
    return (
      <main className="attraction-detail" role="alert">
        <p>{error || '景点不存在或已下架'}</p>
        <Button onClick={() => navigate('/attractions')}>返回景点列表</Button>
      </main>
    )
  }

  const prompt = encodeURIComponent(`帮我规划一个包含${attraction.city}${attraction.name}的旅行行程`)

  return (
    <main className="attraction-detail" aria-labelledby="attraction-detail-title">
      {contextHolder}
      <button type="button" className="attraction-detail__back" onClick={() => navigate(-1)}>
        <ArrowLeftOutlined />
        {' '}
        返回
      </button>
      <section className="attraction-detail__hero">
        <img src={attraction.coverImage} alt="" />
        <div>
          <p className="attraction-detail__city">{attraction.city}</p>
          <h1 id="attraction-detail-title">{attraction.name}</h1>
          <p>{attraction.summary}</p>
          <div className="attraction-detail__tags">
            <Tag color={attraction.ticketType === 'free' ? 'green' : 'orange'}>{attraction.ticketType === 'free' ? '免费' : '收费'}</Tag>
            <Tag>{attraction.priceText}</Tag>
            {attraction.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
          </div>
          <Button onClick={toggleFavorite} aria-label={`${attraction.isFavorite ? '取消收藏' : '收藏'}${attraction.name}`} icon={attraction.isFavorite ? <HeartFilled /> : <HeartOutlined />}>{attraction.isFavorite ? '已收藏' : '收藏'}</Button>
        </div>
      </section>

      <section className="attraction-detail__section">
        <h2>景点介绍</h2>
        <p>{attraction.description}</p>
      </section>
      <section className="attraction-detail__section">
        <h2>实用信息</h2>
        <p>
          地址：
          {attraction.address}
        </p>
        <p>
          开放时间：
          {attraction.openingHours}
        </p>
        <p>
          建议游玩：
          {attraction.recommendedDuration}
        </p>
      </section>
      <section className="attraction-detail__section">
        <h2>游玩亮点</h2>
        <ul>{attraction.highlights.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="attraction-detail__section">
        <h2>注意事项</h2>
        <ul>{attraction.tips.map(item => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="attraction-detail__section">
        <h2>购票入口</h2>
        <p className="attraction-detail__notice">价格、库存和开放时间以第三方平台及景区官方公告为准。</p>
        <div className="attraction-detail__booking">
          {buildBookingLinks(attraction).map(link => (
            <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer">
              去
              {link.label}
              查看
            </a>
          ))}
        </div>
      </section>
      <div className="attraction-detail__actions"><Link to={`/chat?prompt=${prompt}`}>让 AI 帮我规划包含该景点的行程</Link></div>
    </main>
  )
}
