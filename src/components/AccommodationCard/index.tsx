/**
 * 住宿与夜生活推荐卡片
 * 展示目的地的住宿区域和夜间娱乐推荐
 */
import type { AccommodationInfo, NightlifeInfo } from '@/types'

interface AccommodationCardProps {
  accommodation: AccommodationInfo[]
  nightlife: NightlifeInfo[]
}

export function AccommodationCard({ accommodation, nightlife }: AccommodationCardProps) {
  if (!accommodation.length && !nightlife.length)
    return null

  return (
    <div className="mx-4 md:mx-auto md:max-w-4xl">
      {/* 住宿推荐 */}
      {accommodation.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 600, color: 'var(--c-ink)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>住宿推荐</span>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
          >
            {accommodation.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0"
                style={{ borderColor: 'rgba(240, 232, 221, 0.5)' }}
              >
                <div
                  className="shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--c-ink)' }}>{item.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: 'var(--c-sand)', color: 'var(--c-terracotta)' }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--c-ink-light)' }}>{item.description}</p>
                  <p className="text-[11px] mt-1 font-medium" style={{ color: 'var(--c-terracotta)' }}>{item.priceRange}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 夜生活推荐 */}
      {nightlife.length > 0 && (
        <div>
          <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 600, color: 'var(--c-ink)' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
            <span>吃喝玩乐</span>
          </div>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
          >
            {nightlife.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3 border-b last:border-b-0"
                style={{ borderColor: 'rgba(240, 232, 221, 0.5)' }}
              >
                <div
                  className="shrink-0 mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-[11px]"
                  style={{ background: 'var(--c-sand)', color: 'var(--c-ink-light)' }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-semibold" style={{ color: 'var(--c-ink)' }}>{item.name}</span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                      style={{ background: 'var(--c-sand)', color: 'var(--c-ink-light)' }}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'var(--c-ink-light)' }}>{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
