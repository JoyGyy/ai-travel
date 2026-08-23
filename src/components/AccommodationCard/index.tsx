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
        <div className="mb-6 last:mb-0">
          <div className="flex items-center gap-2.5 px-1 pb-3 font-serif text-base font-extrabold text-stone-900">
            <div className="w-2 h-2 rounded-full bg-emerald-700 shadow-[0_0_0_4px_rgba(5,150,105,0.15)]" />
            <span>住宿优选推荐</span>
          </div>
          <div className="overflow-hidden rounded-3xl bg-[#FDFBF7] shadow-sm border border-stone-200/90">
            {accommodation.map((item, i) => (
              <div
                className="relative flex items-start gap-4 py-4 px-5 border-b border-stone-200/80 last:border-b-0"
                key={item.name}
              >
                <div
                  className="shrink-0 mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center text-white bg-emerald-700 shadow-sm text-xs font-bold tabular-nums"
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <span className="text-sm font-bold text-stone-900">
                      {item.name}
                    </span>
                    <span className="py-0.5 px-2.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-200">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-600">
                    {item.description}
                  </p>
                  <p className="w-fit mt-2 py-0.5 px-3 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300/60 text-[11px] font-bold">
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
        <div className="mb-6 last:mb-0">
          <div className="flex items-center gap-2.5 px-1 pb-3 font-serif text-base font-extrabold text-stone-900">
            <div className="w-2 h-2 rounded-full bg-amber-600 shadow-[0_0_0_4px_rgba(217,119,6,0.15)]" />
            <span>当地吃喝玩乐</span>
          </div>
          <div className="overflow-hidden rounded-3xl bg-[#FDFBF7] shadow-sm border border-stone-200/90">
            {nightlife.map((item, i) => (
              <div
                className="relative flex items-start gap-4 py-4 px-5 border-b border-stone-200/80 last:border-b-0"
                key={item}
              >
                <div
                  className="shrink-0 mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center text-amber-900 bg-amber-100 text-xs font-bold tabular-nums"
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-stone-800">
                    {item}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
