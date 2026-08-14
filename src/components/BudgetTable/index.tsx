/**
 * 预算明细表格组件
 *
 * 以表格 + 柱状图的形式展示行程的预算分解情况，
 * 包含住宿、餐饮、交通、门票、其他五个分类及总计。
 */
import './style.css'

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
  const max = Math.max(...Object.values(data).map((v) => v || 0), 1)

  const budgetKeys = Object.keys(labels) as Array<keyof BudgetData>

  return (
    <section aria-labelledby="budget-table-title" className="budget-table">
      <h2 className="budget-table__header" id="budget-table-title">
        <span aria-hidden="true" className="budget-table__dot" />
        <span>预算明细</span>
      </h2>
      <div className="budget-table__card">
        {/* ---- 数值表格 ---- */}
        <table className="budget-table__table">
          <caption className="sr-only">旅行预算分类明细</caption>
          <tbody>
            {budgetKeys.map((key) => (
              <tr className="budget-table__row" key={key}>
                <th className="budget-table__label" scope="row">
                  {labels[key]}
                </th>
                <td className="budget-table__value">¥{data[key] || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* ---- 柱状图可视化 ---- */}
        <div aria-label="预算占比可视化" className="budget-table__bars">
          {budgetKeys.map((key) => (
            <div className="budget-table__bar-row" key={key}>
              <span className="budget-table__bar-label">{labels[key]}</span>
              <div
                aria-label={`${labels[key]}预算 ¥${data[key] || 0}`}
                className="budget-table__bar-track"
                role="img"
              >
                <div
                  className="budget-table__bar-fill"
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
        <div className="budget-table__total">
          <span>总计</span>
          <span className="budget-table__total-value">¥{total}</span>
        </div>
      </div>
    </section>
  )
}
