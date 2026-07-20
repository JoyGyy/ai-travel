/**
 * 景点项目组件
 * 展示单个景点的详细信息
 */
import { ClockCircleOutlined, CompassOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'

import type { AttractionRef } from '@/stores/itinerary'

import './style.css'

interface SpotData {
  spot: string
  description: string
  duration: string
  ticket?: string
  transportation?: string
}

interface SpotItemProps {
  period: '上午' | '下午' | '晚上'
  data: SpotData
  attractionRef?: AttractionRef
}

export function SpotItem({ period, data, attractionRef }: SpotItemProps) {
  const periodColorMap: Record<string, string> = {
    上午: 'var(--travel-period-morning)',
    下午: 'var(--travel-period-afternoon)',
    晚上: 'var(--travel-period-evening)',
  }
  const periodBgMap: Record<string, string> = {
    上午: 'rgba(var(--travel-sand-rgb), 0.2)',
    下午: 'rgba(var(--travel-accent-rgb), 0.18)',
    晚上: 'rgba(var(--travel-ocean-rgb), 0.12)',
  }
  const periodColor = periodColorMap[period] || 'var(--travel-accent)'
  const periodBg = periodBgMap[period] || 'rgba(var(--travel-accent-rgb), 0.16)'

  return (
    <div className="spot-item" style={{ borderLeftColor: periodColor }}>
      <div className="spot-item__period" style={{ color: periodColor, background: periodBg }}>
        {period}
      </div>
      <div className="spot-item__body">
        <h4 className="spot-item__name">{data.spot}</h4>
        <p className="spot-item__desc">{data.description}</p>
        <div className="spot-item__tags">
          <span className="spot-item__tag">
            <ClockCircleOutlined />
            {' '}
            {data.duration}
          </span>
          <span className="spot-item__tag spot-item__tag--price">{data.ticket}</span>
          <span className="spot-item__tag">
            <CompassOutlined />
            {' '}
            {data.transportation}
          </span>
        </div>
        {attractionRef
          ? <Link className="spot-item__detail-link" to={`/attractions/${attractionRef.id}`}>查看{attractionRef.name}详情</Link>
          : null}
      </div>
    </div>
  )
}
