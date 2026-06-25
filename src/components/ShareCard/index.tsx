import type { DayItinerary } from '@/types'
/**
 * 分享卡片组件
 * 用于生成可分享的行程卡片图片，通过 html-to-image 捕获
 */
import { forwardRef } from 'react'

interface ShareCardProps {
  city: string
  days: number
  budget: number | string
  itinerary: DayItinerary[]
}

/** 每日最多显示的景点数量 */
const MAX_SPOTS_PER_DAY = 4

/**
 * 从每日行程中提取景点名称，最多显示 MAX_SPOTS_PER_DAY 个
 */
function getSpotNames(day: DayItinerary): string {
  const spots = [day.morning.spot, day.afternoon.spot, day.evening.spot]
  const display = spots.slice(0, MAX_SPOTS_PER_DAY)
  const suffix = spots.length > MAX_SPOTS_PER_DAY ? '…' : ''
  return display.join(' → ') + suffix
}

export const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>((
  { city, days, budget, itinerary },
  ref,
) => {
  const budgetText = typeof budget === 'number' ? `¥${budget.toLocaleString()}` : budget

  return (
    <div
      ref={ref}
      style={{
        width: 750,
        height: 1334,
        background: 'var(--c-white)',
        borderRadius: 24,
        overflow: 'hidden',
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* 顶部渐变 Hero 区域 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '60px 48px 48px',
          color: '#fff',
        }}
      >
        {/* 城市名 */}
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 48,
            fontWeight: 700,
            marginBottom: 16,
            lineHeight: 1.2,
          }}
        >
          {city}
        </div>
        {/* 天数与预算 */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {days}
            {' '}
            天行程
          </div>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              borderRadius: 12,
              padding: '10px 20px',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            预算
            {' '}
            {budgetText}
          </div>
        </div>
      </div>

      {/* 中间每日行程亮点 */}
      <div style={{ flex: 1, padding: '40px 48px', overflow: 'hidden' }}>
        {/* 区域标题 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 32,
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            fontWeight: 600,
            color: 'var(--c-ink)',
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--c-terracotta)',
            }}
          />
          <span>行程概览</span>
        </div>

        {/* 每日行程列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {itinerary.map(day => (
            <div
              key={day.day}
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'flex-start',
              }}
            >
              {/* 天数标签 */}
              <div
                style={{
                  flexShrink: 0,
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                D
                {day.day}
              </div>
              {/* 行程内容 */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--c-ink)',
                    marginBottom: 6,
                    fontFamily: 'var(--font-serif)',
                  }}
                >
                  {day.date}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: 'var(--c-ink-light)',
                    lineHeight: 1.6,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getSpotNames(day)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部品牌水印 */}
      <div
        style={{
          padding: '24px 48px',
          borderTop: '1px solid var(--c-paper-dark)',
          textAlign: 'center',
          fontSize: 14,
          color: 'var(--c-ink-light)',
          letterSpacing: 1,
        }}
      >
        用 AI 旅行助手规划你的旅程
      </div>
    </div>
  )
})
