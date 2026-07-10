/**
 * 预算明细表格组件
 * 以表格形式展示行程的预算分解情况
 */
import './style.css'

const labels = {
  accommodation: '住宿',
  food: '餐饮',
  transportation: '交通',
  tickets: '门票',
  other: '其他',
}

const barColors = {
  accommodation: 'var(--c-terracotta)',
  food: 'var(--c-gold)',
  transportation: 'var(--c-forest-light)',
  tickets: 'var(--c-forest)',
  other: 'var(--c-ink-light)',
}

export function BudgetTable({ data }) {
  const total = Object.values(data).reduce((sum, v) => sum + (v || 0), 0)
  const max = Math.max(...Object.values(data).map(v => v || 0), 1)

  return (
    <div className="budget-table">
      <div className="budget-table__header">
        <div className="budget-table__dot" />
        <span>预算明细</span>
      </div>
      <div className="budget-table__card">
        {Object.keys(labels).map(key => (
          <div key={key} className="budget-table__row">
            <span className="budget-table__label">{labels[key]}</span>
            <span className="budget-table__divider" />
            <span className="budget-table__value">
              ¥
              {data[key] || 0}
            </span>
          </div>
        ))}
        <div className="budget-table__bars">
          {Object.keys(labels).map(key => (
            <div key={key} className="budget-table__bar-row">
              <span className="budget-table__bar-label">{labels[key]}</span>
              <div className="budget-table__bar-track">
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
    </div>
  )
}
