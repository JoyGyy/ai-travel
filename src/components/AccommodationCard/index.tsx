/**
 * 住宿与夜生活推荐卡片组件
 *
 * 展示行程中的住宿推荐列表和吃喝玩乐推荐列表，
 * 每个住宿项包含名称、类型、描述和价格区间。
 */

interface AccommodationCardProps {
  accommodation: AccommodationItem[]
  nightlife: string[]
}

interface AccommodationItem {
  description?: string
  name: string
  priceRange?: string
  type: string
}

export function AccommodationCard({ accommodation, nightlife }: AccommodationCardProps) {
  // 两项均为空时不渲染
  if (!accommodation.length && !nightlife.length)
    return null

  return (
    <div className="max-w-[900px] mx-auto">
      {/* ---- 住宿推荐列表 ---- */}
      {accommodation.length > 0 && (
        <div className="mb-3.5 last:mb-0">
          <div className="flex items-center gap-2.5 px-1 pb-3 font-[var(--font-display)] text-base font-extrabold text-[var(--travel-ocean)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_5px_rgba(var(--travel-primary-rgb),0.15)]" />
            <span>住宿推荐</span>
          </div>
          <div className="overflow-hidden rounded-3xl bg-travel-surface shadow-[var(--shadow-paper)] border border-[rgba(28,25,23,0.06)]">
            {accommodation.map((item, i) => (
              <div
                className="relative flex items-start gap-[14px] py-4 px-[18px] border-b border-[rgba(var(--travel-ocean-rgb),0.08)] bg-[rgba(var(--travel-white-rgb),0.18)] even:bg-[rgba(28,25,23,0.015)] last:border-b-0"
                key={item.name}
              >
                <div
                  aria-hidden="true"
                  className="shrink-0 mt-px w-[30px] h-[30px] rounded-xl flex items-center justify-center border-none text-white bg-[var(--color-primary)] shadow-[0_10px_24px_rgba(var(--travel-primary-rgb),0.22)] text-xs font-black tabular-nums"
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-black text-[var(--travel-ocean)]">
                      {item.name}
                    </span>
                    <span className="shrink-0 py-[3px] px-2 rounded-full border border-[rgba(var(--travel-white-rgb),0.66)] bg-[rgba(var(--travel-primary-rgb),0.12)] text-[var(--color-primary-strong)] text-[10px] font-extrabold">
                      {item.type}
                    </span>
                  </div>
                  <p className="[overflow-wrap:anywhere] text-xs leading-[1.7] text-[rgba(var(--travel-ink-rgb),0.68)]">
                    {item.description}
                  </p>
                  <p className="w-fit mt-2 py-1 px-2.5 rounded-full bg-[rgba(var(--travel-sand-rgb),0.18)] text-[var(--color-primary-strong)] text-[11px] font-black">
                    {item.priceRange}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- 吃喝玩乐推荐列表 ---- */}
      {nightlife.length > 0 && (
        <div className="mb-3.5 last:mb-0">
          <div className="flex items-center gap-2.5 px-1 pb-3 font-[var(--font-display)] text-base font-extrabold text-[var(--travel-ocean)]">
            <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_5px_rgba(var(--travel-primary-rgb),0.15)]" />
            <span>吃喝玩乐</span>
          </div>
          <div className="overflow-hidden rounded-3xl bg-travel-surface shadow-[var(--shadow-paper)] border border-[rgba(28,25,23,0.06)]">
            {nightlife.map((item, i) => (
              <div
                className="relative flex items-start gap-[14px] py-4 px-[18px] border-b border-[rgba(var(--travel-ocean-rgb),0.08)] bg-[rgba(var(--travel-white-rgb),0.18)] even:bg-[rgba(28,25,23,0.015)] last:border-b-0"
                key={item}
              >
                <div
                  aria-hidden="true"
                  className="shrink-0 mt-px w-[30px] h-[30px] rounded-xl flex items-center justify-center text-[var(--travel-ocean)] bg-[rgba(28,25,23,0.06)] shadow-[0_10px_24px_rgba(var(--travel-ocean-rgb),0.08)] text-xs font-black tabular-nums"
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1.5">
                    <span className="min-w-0 [overflow-wrap:anywhere] text-sm font-black text-[var(--travel-ocean)]">
                      {item}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
