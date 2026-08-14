/**
 * 住宿与夜生活推荐卡片组件
 *
 * 展示行程中的住宿推荐列表和吃喝玩乐推荐列表，
 * 每个住宿项包含名称、类型、描述和价格区间。
 */
import './style.css'

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
  if (!accommodation.length && !nightlife.length) return null

  return (
    <div className="accommodation-card">
      {/* ---- 住宿推荐列表 ---- */}
      {accommodation.length > 0 && (
        <div className="accommodation-card__section">
          <div className="accommodation-card__title">
            <div className="accommodation-card__dot" />
            <span>住宿推荐</span>
          </div>
          <div className="accommodation-card__list">
            {accommodation.map((item, i) => (
              <div className="accommodation-card__item" key={item.name}>
                <div aria-hidden="true" className="accommodation-card__index">
                  {i + 1}
                </div>
                <div className="accommodation-card__body">
                  <div className="accommodation-card__name-row">
                    <span className="accommodation-card__name">{item.name}</span>
                    <span className="accommodation-card__type">{item.type}</span>
                  </div>
                  <p className="accommodation-card__desc">{item.description}</p>
                  <p className="accommodation-card__price">{item.priceRange}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- 吃喝玩乐推荐列表 ---- */}
      {nightlife.length > 0 && (
        <div className="accommodation-card__section">
          <div className="accommodation-card__title">
            <div className="accommodation-card__dot" />
            <span>吃喝玩乐</span>
          </div>
          <div className="accommodation-card__list">
            {nightlife.map((item, i) => (
              <div className="accommodation-card__item" key={item}>
                <div
                  aria-hidden="true"
                  className="accommodation-card__index accommodation-card__index--light"
                >
                  {i + 1}
                </div>
                <div className="accommodation-card__body">
                  <div className="accommodation-card__name-row">
                    <span className="accommodation-card__name">{item}</span>
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
