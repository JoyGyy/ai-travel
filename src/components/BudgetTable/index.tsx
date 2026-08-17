/**
 * 预算明细表格组件
 *
 * 以表格 + 柱状图的形式展示行程的预算分解情况，
 * 包含住宿、餐饮、交通、门票、其他五个分类及总计。
 */

interface BudgetData {
  accommodation?: number
  food?: number
  other?: number
  tickets?: number
  transportation?: number
}

interface BudgetTableProps {
  data: BudgetData
}

const labels: Record<keyof BudgetData, string> = {
  accommodation: '住宿',
  food: '餐饮',
  other: '其他',
  tickets: '门票',
  transportation: '交通',
}

const barColors: Record<keyof BudgetData, string> = {
  accommodation: 'var(--travel-budget-accommodation)',
  food: 'var(--travel-budget-food)',
  other: 'var(--travel-budget-other)',
  tickets: 'var(--travel-budget-tickets)',
  transportation: 'var(--travel-budget-transportation)',
}

export function BudgetTable({ data }: BudgetTableProps) {
  // 计算预算总和与最大单项值（用于柱状图宽度归一化）
  const total = Object.values(data).reduce((sum, v) => sum + (v || 0), 0)
  const max = Math.max(...Object.values(data).map(v => v || 0), 1)

  const budgetKeys = Object.keys(labels) as Array<keyof BudgetData>

  return (
    <section aria-labelledby="budget-table-title" className="pt-[22px] pb-2">
      <h2
        className="flex items-center gap-2.5 px-1 pb-3 font-[var(--font-display)] text-base font-black text-[var(--travel-ocean)]"
        id="budget-table-title"
      >
        <span
          aria-hidden="true"
          className="w-2 h-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_0_5px_rgba(var(--travel-primary-rgb),0.15)]"
        />
        <span>预算明细</span>
      </h2>
      <div className="p-[18px] border border-[rgba(28,25,23,0.06)] rounded-3xl bg-travel-surface shadow-[var(--shadow-paper)]">
        {/* ---- 数值表格 ---- */}
        <table className="w-full border-collapse">
          <caption className="sr-only">旅行预算分类明细</caption>
          <tbody>
            {budgetKeys.map(key => (
              <tr
                className="border-b border-dashed border-[rgba(var(--travel-ocean-rgb),0.14)] last:border-b-0"
                key={key}
              >
                <th className="py-[11px] text-[var(--travel-ocean)] text-sm font-extrabold text-left whitespace-nowrap">
                  {labels[key]}
                </th>
                <td className="py-[11px] text-[var(--color-primary-strong)] font-[var(--font-display)] text-[15px] font-black tabular-nums text-right whitespace-nowrap">
                  ¥
                  {data[key] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* ---- 柱状图可视化 ---- */}
        <div
          aria-label="预算占比可视化"
          className="mt-3.5 pt-3.5 border-t border-[rgba(var(--travel-ocean-rgb),0.1)]"
        >
          {budgetKeys.map(key => (
            <div className="flex items-center gap-2.5 mb-2 last:mb-0" key={key}>
              <span className="w-[34px] shrink-0 text-[rgba(var(--travel-ink-rgb),0.62)] text-[11px] font-bold text-right">
                {labels[key]}
              </span>
              <div
                aria-label={`${labels[key]}预算 ¥${data[key] || 0}`}
                className="flex-1 h-[9px] overflow-hidden rounded-[100px] bg-[rgba(28,25,23,0.06)] shadow-[inset_0_0_0_1px_rgba(var(--travel-ocean-rgb),0.06)]"
                role="img"
              >
                <div
                  className="h-full rounded-[100px] shadow-[0_0_18px_currentColor] transition-[width] duration-500 [transition-timing-function:var(--ease-standard)] motion-reduce:transition-none"
                  style={{
                    background: barColors[key],
                    width: `${((data[key] || 0) / max) * 100}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* ---- 总计行 ---- */}
        <div className="flex items-center justify-between gap-3.5 mt-4 py-[15px] px-4 border border-[rgba(var(--travel-primary-rgb),0.08)] rounded-[18px] text-[var(--travel-ocean)] bg-[rgba(var(--travel-primary-rgb),0.04)] text-sm font-black">
          <span>总计</span>
          <span className="text-[var(--color-primary-strong)] font-[var(--font-display)] text-[21px] font-black leading-none tabular-nums">
            ¥
            {total}
          </span>
        </div>
      </div>
    </section>
  )
}
