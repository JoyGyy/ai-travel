'use client'

/**
 * 旅行行程卡片组件
 * 将纯文本行程解析为结构化的卡片形式展示
 * 支持解析 Markdown 格式的行程文本
 */
import type { LucideIcon } from 'lucide-react'

import { Calendar, Clock, CloudSun, MapPin, Moon, Soup, Star, Sun, Sunrise, Sunset } from 'lucide-react'

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
  icon: LucideIcon
  time: string
}

interface TravelItineraryCardProps {
  content: string
}

/* ========== 解析工具 ========== */

/** 时间段图标映射 */
const TIME_ICONS: Record<string, LucideIcon> = {
  傍晚: Sunset,
  上午: Sunrise,
  中午: Soup,
  下午: CloudSun,
  晚上: Moon,
  早晨: Sun,
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
          icon: TIME_ICONS[time] || MapPin,
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
              icon: TIME_ICONS[time] || MapPin,
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

/* ========== 单日卡片组件 ========== */

function DayCard({ plan }: { plan: DayPlan }) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm transition-all hover:shadow-md">
      {/* 天数标题 */}
      <div className="flex items-center gap-3 bg-emerald-50/70 border-b border-stone-200/80 px-5 py-3.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-700 text-xs font-bold text-white shadow-sm">
          {plan.day}
        </span>
        <div>
          <h4 className="font-serif font-bold text-stone-900 text-sm">
            Day
            {' '}
            {plan.day}
            {' '}
            {plan.title && `· ${plan.title}`}
          </h4>
        </div>
      </div>

      {/* 时间段列表 */}
      <div className="px-5 pb-4 pt-1">
        {plan.periods.map((period) => {
          const PeriodIcon = period.icon
          return (
            <div
              className="flex gap-3.5 border-b border-stone-200/70 py-3 last:border-0"
              key={`${plan.day}-${period.time}`}
            >
              {/* 时间图标 */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100/70 text-emerald-800">
                <PeriodIcon className="h-4 w-4" />
              </div>

              {/* 内容 */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {period.time}
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-stone-700">
                  {period.content}
                </p>
                {period.highlights && (
                  <div className="mt-1.5 flex items-start gap-1.5 text-xs text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200 w-max max-w-full">
                    <Star className="mt-0.5 h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />
                    <span className="truncate">
                      {period.highlights}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {plan.periods.length === 0 && (
          <p className="py-4 text-center text-xs text-stone-400">
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
      <div className="flex items-center gap-3.5 rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-800/20">
          <MapPin size={20} />
        </div>
        <div>
          <h3 className="font-serif font-bold text-stone-900 text-base">{title}</h3>
          <p className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
            <Calendar className="h-3.5 w-3.5 text-emerald-700" />
            {days.length}
            {' '}
            天手账行程
            <Clock className="ml-1 h-3.5 w-3.5 text-amber-600" />
            AI 智能推演
          </p>
        </div>
      </div>

      {/* 每日行程卡片 */}
      <div className="space-y-3.5">
        {days.map(day => (
          <DayCard key={day.day} plan={day} />
        ))}
      </div>
    </div>
  )
}
