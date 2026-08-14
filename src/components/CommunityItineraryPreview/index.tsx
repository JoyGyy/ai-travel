import { Calendar, MapPin, Wallet } from 'lucide-react'

import type { AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'
import type { CommunityItinerarySnapshot } from '@/types/community'

import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { Badge } from '@/components/ui/badge'
import { WeatherCard } from '@/components/WeatherCard'

import './style.css'

interface BudgetTableData {
  accommodation?: number
  food?: number
  other?: number
  tickets?: number
  transportation?: number
}

interface CommunityItineraryPreviewProps {
  mode?: 'compact' | 'detail'
  onRemove?: () => void
  removable?: boolean
  snapshot: CommunityItinerarySnapshot | null
}

export function CommunityItineraryPreview({
  mode = 'compact',
  onRemove,
  removable = false,
  snapshot,
}: CommunityItineraryPreviewProps) {
  if (!snapshot) return null

  const isDetail = mode === 'detail'
  const days = isDetail ? snapshot.itinerary : snapshot.itinerary.slice(0, 2)
  const budget = normalizeBudget(snapshot.budgetBreakdown)

  return (
    <section
      aria-label={`${snapshot.city} 行程快照`}
      className={`community-itinerary community-itinerary--${mode} travel-ticket-edge`}
    >
      <div className="community-itinerary__header">
        <div>
          <p className="community-itinerary__eyebrow">AI 行程快照</p>
          <h3>{snapshot.city}</h3>
        </div>
        {removable ? (
          <button className="community-itinerary__remove" onClick={onRemove} type="button">
            移除行程
          </button>
        ) : null}
      </div>

      <div aria-label="行程概要" className="community-itinerary__meta">
        <Badge className="travel-tag travel-tag--info" variant="secondary">
          <Calendar aria-hidden="true" className="mr-1" size={12} />
          {snapshot.days}天
        </Badge>
        <Badge className="travel-tag travel-tag--success" variant="secondary">
          <Wallet aria-hidden="true" className="mr-1" size={12} />¥{snapshot.budget}
        </Badge>
        <Badge className="travel-tag travel-tag--warning" variant="secondary">
          <MapPin aria-hidden="true" className="mr-1" size={12} />
          {snapshot.itinerary.length}
          段路线
        </Badge>
      </div>

      {snapshot.weather && isDetail ? <WeatherCard weather={snapshot.weather} /> : null}

      <div className="community-itinerary__days">
        {days.map((day) => (
          <article className="community-itinerary__day" key={day.day}>
            <h4>
              Day {day.day}
              {day.title ? ` · ${day.title}` : ''}
            </h4>
            {!isDetail ? <p>{getDaySummary(day) || '这一天还没有详细路线'}</p> : null}
            {isDetail ? (
              <div className="community-itinerary__spots">
                {renderDaySpots(day, snapshot.attractionRefs || [])}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {!isDetail && snapshot.itinerary.length > days.length ? (
        <p className="community-itinerary__more">
          还有 {snapshot.itinerary.length - days.length} 天路线，进入详情查看完整行程。
        </p>
      ) : null}

      {isDetail && budget ? (
        <details className="community-itinerary__collapse">
          <summary className="cursor-pointer font-medium">查看预算明细</summary>
          <BudgetTable data={budget} />
        </details>
      ) : null}

      {isDetail && snapshot.tips?.length ? (
        <div className="community-itinerary__tips">
          <h4>旅行贴士</h4>
          <ul>
            {snapshot.tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}

function findAttractionRef(refs: AttractionRef[] = [], spot?: string) {
  return refs.find((ref) => ref.name === spot)
}

function getDaySummary(day: ItineraryDay): string {
  if (day.spots?.length) return day.spots.map((spot) => spot.name).join(' · ')

  return [day.morning?.spot, day.afternoon?.spot, day.evening?.spot].filter(Boolean).join(' · ')
}

function normalizeBudget(data?: BudgetBreakdown | null): BudgetTableData | null {
  if (!data) return null

  return {
    accommodation: data.accommodation,
    food: data.food,
    other: Math.max(
      0,
      data.total - data.accommodation - data.food - data.transport - data.attractions,
    ),
    tickets: data.attractions,
    transportation: data.transport,
  }
}

function renderDaySpots(day: ItineraryDay, refs: AttractionRef[]) {
  const periods = [
    { data: day.morning, period: '上午' as const },
    { data: day.afternoon, period: '下午' as const },
    { data: day.evening, period: '晚上' as const },
  ]

  if (periods.some((item) => item.data)) {
    return periods.map((item) =>
      item.data ? (
        <SpotItem
          attractionRef={findAttractionRef(refs, item.data.spot)}
          data={item.data}
          key={item.period}
          period={item.period}
        />
      ) : null,
    )
  }

  return day.spots?.map((spot, index) => (
    <SpotItem
      attractionRef={findAttractionRef(refs, spot.name)}
      data={{ description: spot.description, duration: spot.duration, spot: spot.name }}
      key={`${day.day}-${spot.name}`}
      period={index === 0 ? '上午' : index === 1 ? '下午' : '晚上'}
    />
  ))
}
