/**
 * 住宿与夜生活推荐卡片
 */
import './style.css'

export function AccommodationCard({ accommodation, nightlife }) {
  if (!accommodation.length && !nightlife.length)
    return null

  return (
    <div className="accommodation-card">
      {accommodation.length > 0 && (
        <div className="accommodation-card__section">
          <div className="accommodation-card__title">
            <div className="accommodation-card__dot" />
            <span>住宿推荐</span>
          </div>
          <div className="accommodation-card__list">
            {accommodation.map((item, i) => (
              <div key={i} className="accommodation-card__item">
                <div className="accommodation-card__index">{i + 1}</div>
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

      {nightlife.length > 0 && (
        <div className="accommodation-card__section">
          <div className="accommodation-card__title">
            <div className="accommodation-card__dot" />
            <span>吃喝玩乐</span>
          </div>
          <div className="accommodation-card__list">
            {nightlife.map((item, i) => (
              <div key={i} className="accommodation-card__item">
                <div className="accommodation-card__index accommodation-card__index--light">{i + 1}</div>
                <div className="accommodation-card__body">
                  <div className="accommodation-card__name-row">
                    <span className="accommodation-card__name">{item.name}</span>
                    <span className="accommodation-card__type accommodation-card__type--light">{item.type}</span>
                  </div>
                  <p className="accommodation-card__desc">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
