/**
 * 预算明细表格组件
 * 以表格形式展示行程的预算分解情况
 */
import type { BudgetBreakdown } from '@/types'

/** 组件属性接口 */
interface BudgetTableProps {
  data: BudgetBreakdown // 预算明细数据
}

/** 预算类别标签映射 - 将英文字段名转换为中文显示 */
const labels: Record<keyof BudgetBreakdown, string> = {
  accommodation: '住宿',
  food: '餐饮',
  transportation: '交通',
  tickets: '门票',
  other: '其他',
}

/**
 * 预算表格组件
 * 遍历所有预算类别，显示类别名称和对应金额
 */
export function BudgetTable({ data }: BudgetTableProps) {
  return (
    <div className="px-4 mb-2 md:px-8">
      {/* 标题区域 */}
      <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 600, color: 'var(--c-ink)' }}>
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
        <span>预算明细</span>
      </div>
      {/* 表格内容区域 */}
      <div className="p-4 rounded-2xl" style={{ background: 'var(--c-white)', boxShadow: '0 1px 4px rgba(45, 42, 38, 0.04)' }}>
        {/* 遍历所有预算类别，生成表格行 */}
        {(Object.keys(labels) as (keyof BudgetBreakdown)[]).map(key => (
          <div
            key={key}
            className="flex items-center py-2.5 border-b border-dashed last:border-b-0"
            style={{ borderColor: 'var(--c-paper-dark)' }}
          >
            {/* 类别名称 */}
            <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--c-ink)' }}>{labels[key]}</span>
            {/* 点线连接 */}
            <span className="flex-1 mx-3 h-0 border-b border-dotted" style={{ borderColor: 'var(--c-paper-dark)' }} />
            {/* 金额显示 */}
            <span className="whitespace-nowrap" style={{ fontFamily: 'var(--font-serif)', fontSize: '15px', fontWeight: 600, color: 'var(--c-terracotta)' }}>
              ¥{data[key] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
