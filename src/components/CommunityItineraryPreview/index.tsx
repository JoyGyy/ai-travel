import type { AttractionRef, BudgetBreakdown, ItineraryDay } from '@/stores/itinerary'
import type { CommunityItinerarySnapshot } from '@/types/community'
import { CalendarOutlined, EnvironmentOutlined, WalletOutlined } from '@ant-design/icons'
import { Collapse, Tag } from 'antd'

import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { WeatherCard } from '@/components/WeatherCard'

import './style.css'

interface CommunityItineraryPreviewProps {
  snapshot: CommunityItinerarySnapshot | null
  mode?: 'compact' | 'detail'
  removable?: boolean
  onRemove?: () => void
}

interface BudgetTableData {
  accommodation?: number
  food?: number
  transportation?: number
  tickets?: number
  other?: number
}

function normalizeBudget(data?: BudgetBreakdown | null): BudgetTableData | null {
  if (!data)
    return null

  return {
    accommodation: data.accommodation,
    food: data.food,
    transportation: data.transport,
    tickets: data.attractions,
    other: Math.max(0, data.total - data.accommodation - data.food - data.transport - data.attractions),
  }
}

function findAttractionRef(refs: AttractionRef[] = [], spot?: string) {
  return refs.find(ref => ref.name === spot)
}

function getDaySummary(day: ItineraryDay): string {
  if (day.spots?.length)
    return day.spots.map(spot => spot.name).join(' · ')

  return [day.morning?.spot, day.afternoon?.spot, day.evening?.spot]
    .filter(Boolean)
    .join(' · ')
}

function renderDaySpots(day: ItineraryDay, refs: AttractionRef[]) {
  const periods = [
    { period: '上午' as const, data: day.morning },
    { period: '下午' as const, data: day.afternoon },
    { period: '晚上' as const, data: day.evening },
  ]

  if (periods.some(item => item.data)) {
    return periods.map(item => item.data
      ? (
          <SpotItem
            key={item.period}
            period={item.period}
            data={item.data}
            attractionRef={findAttractionRef(refs, item.data.spot)}
          />
        )
      : null)
  }

  return day.spots?.map((spot, index) => (
    <SpotItem
      key={`${day.day}-${spot.name}`}
      period={index === 0 ? '上午' : index === 1 ? '下午' : '晚上'}
      data={{ spot: spot.name, description: spot.description, duration: spot.duration }}
      attractionRef={findAttractionRef(refs, spot.name)}
    />
  ))
}

export function CommunityItineraryPreview({ snapshot, mode = 'compact', removable = false, onRemove }: CommunityItineraryPreviewProps) {
  if (!snapshot)
    return null

  const isDetail = mode === 'detail'
  const days = isDetail ? snapshot.itinerary : snapshot.itinerary.slice(0, 2)
  const budget = normalizeBudget(snapshot.budgetBreakdown)

  return (
    <section className={`community-itinerary community-itinerary--${mode} travel-ticket-edge`} aria-label={`${snapshot.city} 行程快照`}>
      <div className="community-itinerary__header">
        <div>
          <p className="community-itinerary__eyebrow">AI 行程快照</p>
          <h3>{snapshot.city}</h3>
        </div>
        {removable
          ? <button type="button" className="community-itinerary__remove" onClick={onRemove}>移除行程</button>
          : null}
      </div>

      <div className="community-itinerary__meta" aria-label="行程概要">
        <Tag className="travel-tag travel-tag--info" icon={<CalendarOutlined aria-hidden="true" />}>
          {snapshot.days}
          天
        </Tag>
        <Tag className="travel-tag travel-tag--success" icon={<WalletOutlined aria-hidden="true" />}>
          ¥
          {snapshot.budget}
        </Tag>
        <Tag className="travel-tag travel-tag--warning" icon={<EnvironmentOutlined aria-hidden="true" />}>
          {snapshot.itinerary.length}
          段路线
        </Tag>
      </div>

      {snapshot.weather && isDetail ? <WeatherCard weather={snapshot.weather} /> : null}

      <div className="community-itinerary__days">
        {days.map(day => (
          <article key={day.day} className="community-itinerary__day">
            <h4>
              Day
              {' '}
              {day.day}
              {day.title ? ` · ${day.title}` : ''}
            </h4>
            {!isDetail ? <p>{getDaySummary(day) || '这一天还没有详细路线'}</p> : null}
            {isDetail ? <div className="community-itinerary__spots">{renderDaySpots(day, snapshot.attractionRefs || [])}</div> : null}
          </article>
        ))}
      </div>

      {!isDetail && snapshot.itinerary.length > days.length
        ? (
            <p className="community-itinerary__more">
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
            <Collapse
              className="community-itinerary__collapse"
              items={[{ key: 'budget', label: '查看预算明细', children: <BudgetTable data={budget} /> }]}
            />
          )
        : null}

      {isDetail && snapshot.tips?.length
        ? (
            <div className="community-itinerary__tips">
              <h4>旅行贴士</h4>
              <ul>
                {snapshot.tips.map(tip => <li key={tip}>{tip}</li>)}
              </ul>
            </div>
          )
        : null}
    </section>
  )
}
