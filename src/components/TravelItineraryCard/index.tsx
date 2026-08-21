'use client'

/**
 * 旅行行程卡片组件
 * 将纯文本行程解析为结构化的卡片形式展示
 * 支持解析 Markdown 格式的行程文本
 */
import { Calendar, Clock, MapPin, Star } from 'lucide-react'

/* ========== 类型定义 ========== */

interface DayPlan {
  day: number
  periods: PeriodPlan[]
  subtitle?: string
  title: string
}

interface PeriodPlan {
  content: string
  highlights?: string
  icon: string
  time: string
}

interface TravelItineraryCardProps {
  content: string
}

/* ========== 解析工具 ========== */

/** 时间段图标映射 */
const TIME_ICONS: Record<string, string> = {
  傍晚: '🌆',
  上午: '🌅',
  中午: '🍜',
  下午: '🌤️',
  晚上: '🌙',
  早晨: '🌄',
}

/** 从文本中提取标题 */
function extractTitle(text: string): string {
  const titleMatch = text.match(/#+\s*(.+)\n?/)
  return titleMatch?.[1]?.trim() || '旅行行程'
}

/** 从文本中提取每日计划 */
function parseDays(text: string): DayPlan[] {
  const days: DayPlan[] = []

  // 按行查找 Day 标记
  const lines = text.split('\n')
  let currentDay: DayPlan | null = null

  for (const line of lines) {
    // 匹配 Day 标记
    const dayMatch = line.match(/(?:###?\s*)?(?:Day\s*)?(\d+)[：:]\s*(.+)/i)
    if (dayMatch && /Day|天/i.test(line)) {
      if (currentDay) {
        days.push(currentDay)
      }
      currentDay = {
        day: Number.parseInt(dayMatch[1]),
        periods: [],
        title: dayMatch[2].trim(),
      }
      continue
    }

    // 匹配时间段
    if (currentDay) {
      const periodMatch = line.match(
        /\*\*(上午|中午|下午|傍晚|晚上|早晨)\*\*[：:](.+)/,
      )
      if (periodMatch) {
        const time = periodMatch[1]
        const content = periodMatch[2].trim()

        // 提取亮点
        const highlightMatch = content.match(/\*\*亮点\*\*[：:](.+)/)
        const highlights = highlightMatch?.[1]?.trim()

        // 清理内容
        const cleanContent = content
          .replace(/\*\*亮点\*\*.+$/, '')
          .replace(/预算约\d+元/g, '')
          .trim()

        currentDay.periods.push({
          content: cleanContent,
          highlights,
          icon: TIME_ICONS[time] || '📍',
          time,
        })
      }
    }
  }

  // 添加最后一个 day
  if (currentDay) {
    days.push(currentDay)
  }

  // 如果没有找到 Day 标记，尝试按表格解析
  if (days.length === 0) {
    const tableRows = text
      .split('\n')
      .filter(row => row.includes('|') && !row.includes('---'))
    if (tableRows.length > 0) {
      let tableDay: DayPlan | null = null
      for (const row of tableRows) {
        const cells = row
          .split('|')
          .map(cell => cell.trim())
          .filter(Boolean)
        if (cells.length >= 3) {
          const time = cells[0].replace(/\P{Script=Han}/gu, '').trim()
          const content = cells[1]
          const highlights = cells[2]

          if (time && content) {
            if (!tableDay) {
              tableDay = { day: 1, periods: [], title: '行程安排' }
            }
            tableDay.periods.push({
              content,
              highlights: highlights !== '亮点' ? highlights : undefined,
              icon: TIME_ICONS[time] || '📍',
              time,
            })
          }
        }
      }
      if (tableDay) {
        days.push(tableDay)
      }
    }
  }

  return days
}

/* ========== 单日卡片组件 ========== */

function DayCard({ plan }: { plan: DayPlan }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-travel-ink/8 bg-travel-surface shadow-sm transition-all hover:shadow-md">
      {/* 天数标题 */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-travel-ocean/8 to-transparent px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-travel-ocean text-sm font-bold text-white">
          {plan.day}
        </span>
        <div>
          <h4 className="font-bold text-travel-ink">
            Day
            {' '}
            {plan.day}
          </h4>
          {plan.title && (
            <p className="text-xs text-travel-muted">
              {plan.title}
            </p>
          )}
        </div>
      </div>

      {/* 时间段列表 */}
      <div className="px-4 pb-4">
        {plan.periods.map(period => (
          <div
            className="flex gap-3 border-b border-travel-ink/5 py-2.5 last:border-0"
            key={`${plan.day}-${period.time}`}
          >
            {/* 时间图标 */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-travel-sand/30 text-base">
              {period.icon}
            </div>

            {/* 内容 */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-travel-ocean">
                  {period.time}
                </span>
              </div>
              <p className="mt-0.5 text-sm leading-relaxed text-travel-ink/80">
                {period.content}
              </p>
              {period.highlights && (
                <div className="mt-1.5 flex items-start gap-1.5">
                  <Star className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                  <span className="text-xs text-travel-muted">
                    {period.highlights}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {plan.periods.length === 0 && (
          <p className="py-3 text-center text-sm text-travel-muted">
            暂无详细安排
          </p>
        )}
      </div>
    </div>
  )
}

/* ========== 主组件 ========== */

export function TravelItineraryCard({ content }: TravelItineraryCardProps) {
  const title = extractTitle(content)
  const days = parseDays(content)

  // 如果没有解析出每日计划，返回 null 让调用者使用默认渲染
  if (days.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 标题区域 */}
      <div className="flex items-center gap-3 rounded-2xl border border-travel-ink/8 bg-gradient-to-r from-travel-ocean/10 to-travel-sand/20 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-travel-ocean text-white">
          <MapPin size={20} />
        </div>
        <div>
          <h3 className="font-bold text-travel-ink">{title}</h3>
          <p className="flex items-center gap-2 text-xs text-travel-muted">
            <Calendar className="h-3 w-3" />
            {days.length}
            天行程
            <Clock className="ml-1 h-3 w-3" />
            AI 智能规划
          </p>
        </div>
      </div>

      {/* 每日行程卡片 */}
      <div className="space-y-3">
        {days.map(day => (
          <DayCard key={day.day} plan={day} />
        ))}
      </div>
    </div>
  )
}
