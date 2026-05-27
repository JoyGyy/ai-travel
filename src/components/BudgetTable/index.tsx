/**
 * 预算明细表格组件
 * 以表格形式展示行程的预算分解情况
 */
import type { BudgetBreakdown } from '@/types'

interface BudgetTableProps {
  data: BudgetBreakdown
}

const labels: Record<keyof BudgetBreakdown, string> = {
  accommodation: '住宿',
  food: '餐饮',
  transportation: '交通',
  tickets: '门票',
  other: '其他',
}

const barColors: Record<keyof BudgetBreakdown, string> = {
  accommodation: 'var(--c-terracotta)',
  food: 'var(--c-gold)',
  transportation: 'var(--c-forest-light)',
  tickets: 'var(--c-forest)',
  other: 'var(--c-ink-light)',
}

export function BudgetTable({ data }: BudgetTableProps) {
  const total = Object.values(data).reduce((sum, v) => sum + (v || 0), 0)
  const max = Math.max(...Object.values(data).map(v => v || 0), 1)

  return (
    <div className="px-4 mb-2 md:px-8">
      <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--c-ink)' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
        <span>预算明细</span>
      </div>
      <div className="p-4 rounded-2xl" style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)' }}>
        {(Object.keys(labels) as (keyof BudgetBreakdown)[]).map(key => (
          <div
            key={key}
            className="flex items-center py-2.5 border-b border-dashed last:border-b-0"
            style={{ borderColor: 'var(--c-paper-dark)' }}
          >
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--c-ink)' }}>{labels[key]}</span>
            <span className="flex-1 mx-3 h-0 border-b border-dotted" style={{ borderColor: 'var(--c-paper-dark)' }} />
            <span className="whitespace-nowrap tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--c-terracotta)' }}>
              ¥{data[key] || 0}
            </span>
          </div>
        ))}
        {/* 预算柱状图 */}
        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--c-paper-dark)' }}>
          {(Object.keys(labels) as (keyof BudgetBreakdown)[]).map(key => (
            <div key={key} className="flex items-center gap-2 mb-1.5 last:mb-0">
              <span className="text-[11px] w-8 text-right shrink-0" style={{ color: 'var(--c-ink-light)' }}>{labels[key]}</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--c-paper)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${((data[key] || 0) / max) * 100}%`, background: barColors[key] }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* 总计 */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: 'var(--c-paper-dark)' }}>
          <span className="text-sm font-semibold" style={{ color: 'var(--c-ink)' }}>总计</span>
          <span className="tabular-nums" style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--c-terracotta)' }}>
            ¥{total}
          </span>
        </div>
      </div>
    </div>
  )
}
