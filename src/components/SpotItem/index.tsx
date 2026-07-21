/**
 * 景点项目组件
 *
 * 展示行程中单个景点的详细信息，包括时段标签、
 * 景点名称、描述、游玩时长、门票价格和交通方式。
 * 支持链接到景点详情页。
 */
import type { AttractionRef } from '@/stores/itinerary'
import { ClockCircleOutlined, CompassOutlined } from '@ant-design/icons'

import { Link } from 'react-router-dom'

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
  // 根据时段（上午/下午/晚上）映射不同的主题色和背景色
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
        {/* ---- 标签：游玩时长 / 门票 / 交通方式 ---- */}
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
        {/* ---- 关联景点详情链接（有 attractionRef 时显示） ---- */}
        {attractionRef
          ? (
              <Link className="spot-item__detail-link" to={`/attractions/${attractionRef.id}`}>
                {`查看${attractionRef.name}详情`}
              </Link>
            )
          : null}
      </div>
    </div>
  )
}
