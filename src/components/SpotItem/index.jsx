/**
 * 景点项目组件
 * 展示单个景点的详细信息
 */
import { ClockCircleOutlined, CompassOutlined } from '@ant-design/icons'
import './style.css'

export function SpotItem({ period, data }) {
  const periodColorMap = {
    上午: 'var(--c-gold)',
    下午: 'var(--c-terracotta)',
    晚上: 'var(--c-forest)',
  }
  const periodBgMap = {
    上午: 'var(--c-sand)',
    下午: 'rgba(99, 102, 241, 0.1)',
    晚上: 'rgba(30, 41, 59, 0.1)',
  }
  const periodColor = periodColorMap[period] || 'var(--c-terracotta)'
  const periodBg = periodBgMap[period] || 'var(--c-sand)'

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
            <ClockCircleOutlined /> {data.duration}
          </span>
          <span className="spot-item__tag spot-item__tag--price">{data.ticket}</span>
          <span className="spot-item__tag">
            <CompassOutlined /> {data.transportation}
          </span>
        </div>
      </div>
    </div>
  )
}
