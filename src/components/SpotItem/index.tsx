/**
 * 景点项目组件
 * 展示单个景点的详细信息，包括名称、描述、时长、门票和交通
 */
import { ClockCircleOutline, CompassOutline } from 'antd-mobile-icons'
import type { SpotData } from '@/types'

/** 组件属性接口 */
interface SpotItemProps {
  period: string  // 时段名称，如 "上午"、"下午"、"晚上"
  data: SpotData  // 景点数据
}

/**
 * 景点项目组件
 * 左侧显示时段标签，右侧显示景点详细信息
 */
export function SpotItem({ period, data }: SpotItemProps) {
  const periodColorMap: Record<string, string> = {
    上午: 'var(--c-gold)',
    下午: 'var(--c-terracotta)',
    晚上: 'var(--c-forest)',
  }
  const periodColor = periodColorMap[period] || 'var(--c-terracotta)'

  const periodBgMap: Record<string, string> = {
    上午: 'var(--c-sand)',
    下午: 'rgba(99, 102, 241, 0.1)',
    晚上: 'rgba(30, 41, 59, 0.1)',
  }
  const periodBg = periodBgMap[period] || 'var(--c-sand)'

  return (
    <div
      className="flex gap-3 py-3 border-b border-dashed transition-all duration-200"
      style={{ borderColor: 'var(--c-paper-dark)', borderLeft: `3px solid ${periodColor}` }}
    >
      <div
        className="shrink-0 self-start"
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '12px',
          fontWeight: 600,
          color: periodColor,
          background: periodBg,
          padding: '4px 10px',
          borderRadius: '8px',
          whiteSpace: 'nowrap',
        }}
      >
        {period}
      </div>
      {/* 景点详情 */}
      <div className="flex-1 min-w-0">
        {/* 景点名称 */}
        <h4 className="mb-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600, color: 'var(--c-ink)' }}>
          {data.spot}
        </h4>
        {/* 景点描述 - 最多显示 2 行，超出部分省略 */}
        <p
          className="mb-2"
          style={{
            fontSize: '12px',
            color: 'var(--c-ink-light)',
            lineHeight: 1.6,
            display: '-webkit-box',
            WebkitLineClamp: 2, // 限制显示 2 行
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden', // 超出部分隐藏
          }}
        >
          {data.description}
        </p>
        {/* 景点元信息标签 */}
        <div className="flex gap-2 flex-wrap">
          {/* 游览时长 */}
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs" style={{ color: 'var(--c-ink-light)', background: 'var(--c-paper)' }}>
            <ClockCircleOutline />
            {data.duration}
          </span>
          {/* 门票价格 */}
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium" style={{ color: 'var(--c-terracotta)', background: 'var(--c-sand)' }}>
            {data.ticket}
          </span>
          {/* 交通方式 */}
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs" style={{ color: 'var(--c-ink-light)', background: 'var(--c-paper)' }}>
            <CompassOutline />
            {data.transportation}
          </span>
        </div>
      </div>
    </div>
  )
}
