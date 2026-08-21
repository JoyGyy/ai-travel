import type { AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'

import type { CommunityItinerarySnapshot } from '@/types/community'
import { Calendar, MapPin, Wallet } from 'lucide-react'

import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { Badge } from '@/components/ui/badge'
import { WeatherCard } from '@/components/WeatherCard'

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
  if (!snapshot)
    return null

  const isDetail = mode === 'detail'
  const days = isDetail ? snapshot.itinerary : snapshot.itinerary.slice(0, 2)
  const budget = normalizeBudget(snapshot.budgetBreakdown)

  return (
    <section
      className={`${mode === 'compact' ? 'p-4 sm:p-5' : 'p-5'} sm:rounded-3xl rounded-[20px] border border-accent/18 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(212,167,106,0.16)),radial-gradient(circle_at_100%_0%,rgba(41,37,36,0.12),transparent_38%)] travel-ticket-edge`}
    >
      <div className="sm:flex-row flex-col flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="m-0 mb-1 text-accent text-[0.78rem] font-extrabold tracking-[0.16em] uppercase">
            AI 行程快照
          </p>
          <h3 className="m-0 text-travel-ink text-[clamp(1.25rem,2vw,1.7rem)]">
            {snapshot.city}
          </h3>
        </div>
        {removable
          ? (
              <button
                className="min-h-9.5 border-0 rounded-full text-destructive bg-destructive/8 cursor-pointer px-3.5 font-bold"
                onClick={onRemove}
                type="button"
              >
                移除行程
              </button>
            )
          : null}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <Badge className="travel-tag travel-tag--info" variant="secondary">
          <Calendar className="mr-1" size={12} />
          {snapshot.days}
          天
        </Badge>
        <Badge className="travel-tag travel-tag--success" variant="secondary">
          <Wallet className="mr-1" size={12} />
          ¥
          {snapshot.budget}
        </Badge>
        <Badge className="travel-tag travel-tag--warning" variant="secondary">
          <MapPin className="mr-1" size={12} />
          {snapshot.itinerary.length}
          段路线
        </Badge>
      </div>

      {snapshot.weather && isDetail ? <WeatherCard weather={snapshot.weather} /> : null}

      <div className="grid gap-3">
        {days.map(day => (
          <article
            className="p-3.5 border border-dashed border-accent/26 rounded-[18px] bg-[rgba(255,255,255,0.68)]"
            key={day.day}
          >
            <h4 className="m-0 text-travel-ink text-base mb-1.5">
              Day
              {' '}
              {day.day}
              {day.title ? ` · ${day.title}` : ''}
            </h4>
            {!isDetail
              ? (
                  <p className="m-0 text-travel-muted leading-7">
                    {getDaySummary(day) || '这一天还没有详细路线'}
                  </p>
                )
              : null}
            {isDetail
              ? (
                  <div className="grid gap-3 mt-3">
                    {renderDaySpots(day, snapshot.attractionRefs || [])}
                  </div>
                )
              : null}
          </article>
        ))}
      </div>

      {!isDetail && snapshot.itinerary.length > days.length
        ? (
            <p className="m-0 mt-3 text-[0.92rem] text-travel-muted leading-7">
              还有
              {' '}
              {snapshot.itinerary.length - days.length}
              {' '}
              天路线，进入详情查看完整行程。
            </p>
          )
        : null}

      {isDetail && budget
        ? (
            <details className="mt-[18px] bg-[rgba(255,255,255,0.72)] rounded-[18px]">
              <summary className="cursor-pointer font-medium">查看预算明细</summary>
              <BudgetTable data={budget} />
            </details>
          )
        : null}

      {isDetail && snapshot.tips?.length
        ? (
            <div className="mt-[18px] p-4 rounded-[18px] bg-travel-ocean/8">
              <h4 className="m-0 text-travel-ink text-base mb-1.5">旅行贴士</h4>
              <ul className="m-0 mt-2.5 pl-5 text-travel-muted leading-[1.8]">
                {snapshot.tips.map(tip => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
            </div>
          )
        : null}
    </section>
  )
}

function findAttractionRef(refs: AttractionRef[] = [], spot?: string) {
  return refs.find(ref => ref.name === spot)
}

function getDaySummary(day: ItineraryDay): string {
  if (day.spots?.length)
    return day.spots.map(spot => spot.name).join(' · ')

  return [day.morning?.spot, day.afternoon?.spot, day.evening?.spot].filter(Boolean).join(' · ')
}

function normalizeBudget(data?: BudgetBreakdown | null): BudgetTableData | null {
  if (!data)
    return null

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

  if (periods.some(item => item.data)) {
    return periods.map(item =>
      item.data
        ? (
            <SpotItem
              attractionRef={findAttractionRef(refs, item.data.spot)}
              data={item.data}
              key={item.period}
              period={item.period}
            />
          )
        : null,
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
