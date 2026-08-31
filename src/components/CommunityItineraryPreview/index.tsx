import type { AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'
import type { CommunityItinerarySnapshot } from '@/types/community'
import { Calendar, MapPin, Wallet } from 'lucide-react'
import { useMemo } from 'react'

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
  snapshot: CommunityItinerarySnapshot | null | string
}

export function CommunityItineraryPreview({
  mode = 'compact',
  onRemove,
  removable = false,
  snapshot,
}: CommunityItineraryPreviewProps) {
  const safeSnapshot = useMemo<CommunityItinerarySnapshot | null>(() => {
    if (!snapshot)
      return null

    let parsed: unknown = snapshot
    if (typeof snapshot === 'string') {
      try {
        parsed = JSON.parse(snapshot)
      }
      catch {
        return null
      }
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      return null

    const obj = parsed as Record<string, unknown>
    const itinerary = Array.isArray(obj.itinerary) ? (obj.itinerary as ItineraryDay[]) : []
    const days = typeof obj.days === 'number' && obj.days > 0 ? obj.days : Math.max(1, itinerary.length)
    const budget = typeof obj.budget === 'number' ? obj.budget : 0
    const city = typeof obj.city === 'string' && obj.city ? obj.city : '行程目的地'
    const tips = Array.isArray(obj.tips) ? (obj.tips as string[]) : []
    const attractionRefs = Array.isArray(obj.attractionRefs) ? (obj.attractionRefs as AttractionRef[]) : []
    const budgetBreakdown = obj.budgetBreakdown && typeof obj.budgetBreakdown === 'object'
      ? (obj.budgetBreakdown as BudgetBreakdown)
      : null

    return {
      attractionRefs,
      budget,
      budgetBreakdown,
      city,
      days,
      itinerary,
      tips,
      weather: (obj.weather as CommunityItinerarySnapshot['weather']) ?? null,
    }
  }, [snapshot])

  if (!safeSnapshot)
    return null

  const isDetail = mode === 'detail'
  const itinerary = safeSnapshot.itinerary || []
  const days = isDetail ? itinerary : itinerary.slice(0, 2)
  const budget = normalizeBudget(safeSnapshot.budgetBreakdown)

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
            {safeSnapshot.city}
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
          {safeSnapshot.days}
          天
        </Badge>
        <Badge className="travel-tag travel-tag--success" variant="secondary">
          <Wallet className="mr-1" size={12} />
          ¥
          {safeSnapshot.budget}
        </Badge>
        <Badge className="travel-tag travel-tag--warning" variant="secondary">
          <MapPin className="mr-1" size={12} />
          {itinerary.length}
          段路线
        </Badge>
      </div>

      {safeSnapshot.weather && isDetail ? <WeatherCard weather={safeSnapshot.weather} /> : null}

      {days.length > 0 && (
        <div className="grid gap-3">
          {days.map((day, dIdx) => (
            <article
              className="p-3.5 border border-dashed border-accent/26 rounded-[18px] bg-[rgba(255,255,255,0.68)]"
              key={day?.day ?? dIdx + 1}
            >
              <h4 className="m-0 text-travel-ink text-base mb-1.5">
                Day
                {' '}
                {day?.day ?? dIdx + 1}
                {day?.title ? ` · ${day.title}` : ''}
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
                      {renderDaySpots(day, safeSnapshot.attractionRefs || [])}
                    </div>
                  )
                : null}
            </article>
          ))}
        </div>
      )}

      {!isDetail && itinerary.length > days.length
        ? (
            <p className="m-0 mt-3 text-[0.92rem] text-travel-muted leading-7">
              还有
              {' '}
              {itinerary.length - days.length}
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

      {isDetail && safeSnapshot.tips?.length
        ? (
            <div className="mt-[18px] p-4 rounded-[18px] bg-travel-ocean/8">
              <h4 className="m-0 text-travel-ink text-base mb-1.5">旅行贴士</h4>
              <ul className="m-0 mt-2.5 pl-5 text-travel-muted leading-[1.8]">
                {safeSnapshot.tips.map(tip => (
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
  if (!spot || !Array.isArray(refs))
    return undefined
  return refs.find(ref => ref?.name === spot)
}

function getDaySummary(day?: ItineraryDay): string {
  if (!day)
    return ''

  if (Array.isArray(day.spots) && day.spots.length > 0) {
    return day.spots
      .map(spot => (typeof spot === 'string' ? spot : spot?.name || ''))
      .filter(Boolean)
      .join(' · ')
  }

  return [day.morning?.spot, day.afternoon?.spot, day.evening?.spot].filter(Boolean).join(' · ')
}

function normalizeBudget(data?: BudgetBreakdown | null): BudgetTableData | null {
  if (!data || typeof data !== 'object')
    return null

  const accommodation = Number(data.accommodation) || 0
  const food = Number(data.food) || 0
  const transport = Number(data.transport) || 0
  const attractions = Number(data.attractions) || 0
  const total = Number(data.total) || (accommodation + food + transport + attractions)

  return {
    accommodation,
    food,
    other: Math.max(0, total - accommodation - food - transport - attractions),
    tickets: attractions,
    transportation: transport,
  }
}

function renderDaySpots(day: ItineraryDay, refs: AttractionRef[]) {
  if (!day)
    return null

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

  if (Array.isArray(day.spots)) {
    return day.spots.map((spot, index) => {
      const name = typeof spot === 'string' ? spot : spot?.name || `景点 ${index + 1}`
      const description = typeof spot === 'string' ? '' : spot?.description || ''
      const duration = typeof spot === 'string' ? '' : spot?.duration || ''

      return (
        <SpotItem
          attractionRef={findAttractionRef(refs, name)}
          data={{ description, duration, spot: name }}
          key={`${day.day || 1}-${name}-${index}`}
          period={index === 0 ? '上午' : index === 1 ? '下午' : '晚上'}
        />
      )
    })
  }

  return null
}
