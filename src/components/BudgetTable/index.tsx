/**
 * 预算明细表格组件
 * 以表格形式展示行程的预算分解情况
 */
import './style.css'

interface BudgetData {
  accommodation?: number
  food?: number
  transportation?: number
  tickets?: number
  other?: number
}

interface BudgetTableProps {
  data: BudgetData
}

const labels: Record<keyof BudgetData, string> = {
  accommodation: '住宿',
  food: '餐饮',
  transportation: '交通',
  tickets: '门票',
  other: '其他',
}

const barColors: Record<keyof BudgetData, string> = {
  accommodation: 'var(--travel-budget-accommodation)',
  food: 'var(--travel-budget-food)',
  transportation: 'var(--travel-budget-transportation)',
  tickets: 'var(--travel-budget-tickets)',
  other: 'var(--travel-budget-other)',
}

export function BudgetTable({ data }: BudgetTableProps) {
  const total = Object.values(data).reduce((sum, v) => sum + (v || 0), 0)
  const max = Math.max(...Object.values(data).map(v => v || 0), 1)

  return (
    <section className="budget-table" aria-labelledby="budget-table-title">
      <h2 id="budget-table-title" className="budget-table__header">
        <span className="budget-table__dot" aria-hidden="true" />
        <span>预算明细</span>
      </h2>
      <div className="budget-table__card">
        <table className="budget-table__table">
          <caption className="sr-only">旅行预算分类明细</caption>
          <tbody>
            {Object.keys(labels).map(key => (
              <tr key={key} className="budget-table__row">
                <th scope="row" className="budget-table__label">{labels[key]}</th>
                <td className="budget-table__value">
                  ¥
                  {data[key] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="budget-table__bars" aria-label="预算占比可视化">
          {Object.keys(labels).map(key => (
            <div key={key} className="budget-table__bar-row">
              <span className="budget-table__bar-label">{labels[key]}</span>
              <div
                className="budget-table__bar-track"
                role="img"
                aria-label={`${labels[key]}预算 ¥${data[key] || 0}`}
              >
                <div
                  className="budget-table__bar-fill"
                  style={{ width: `${((data[key] || 0) / max) * 100}%`, background: barColors[key] }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="budget-table__total">
          <span>总计</span>
          <span className="budget-table__total-value">
            ¥
            {total}
          </span>
        </div>
      </div>
    </section>
  )
}
