'use client'

import { motion } from 'framer-motion'
import { RotateCcw, Sliders } from 'lucide-react'
import { useState } from 'react'

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
  accommodation: '#ea580c',
  food: '#d97706',
  other: '#78716c',
  tickets: '#059669',
  transportation: '#0284c7',
}

export function BudgetTable({ data }: BudgetTableProps) {
  // 原始总和
  const initialTotal = Object.values(data).reduce((sum, v) => sum + (v || 0), 0)
  const [multiplier, setMultiplier] = useState(1)

  // 动态调整后的数值
  const currentTotal = Math.round(initialTotal * multiplier)
  const currentData: BudgetData = {
    accommodation: Math.round((data.accommodation || 0) * multiplier),
    food: Math.round((data.food || 0) * multiplier),
    other: Math.round((data.other || 0) * multiplier),
    tickets: Math.round((data.tickets || 0) * multiplier),
    transportation: Math.round((data.transportation || 0) * multiplier),
  }

  const max = Math.max(...Object.values(currentData).map(v => v || 0), 1)
  const budgetKeys = Object.keys(labels) as Array<keyof BudgetData>

  // 出行等级评级
  const tierInfo = currentTotal < 2500
    ? { color: 'text-amber-800 bg-amber-100 border-amber-300', text: '🎒 背包探索 · 经济精打细算' }
    : currentTotal <= 6000
      ? { color: 'text-emerald-800 bg-emerald-100 border-emerald-300', text: '🌿 惬意漫游 · 舒适优选推荐' }
      : { color: 'text-purple-800 bg-purple-100 border-purple-300', text: '✨ 深度度假 · 品质轻奢体验' }

  return (
    <section className="pt-6 pb-2">
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <h2
          className="flex items-center gap-2.5 font-serif text-base font-extrabold text-stone-900"
          id="budget-table-title"
        >
          <span
            className="w-2 h-2 rounded-full bg-emerald-700 shadow-[0_0_0_4px_rgba(5,150,105,0.15)]"
          />
          <span>预算智能分解 & 动态模拟</span>
        </h2>
        {multiplier !== 1 && (
          <button
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-900 cursor-pointer"
            onClick={() => setMultiplier(1)}
            type="button"
          >
            <RotateCcw className="h-3 w-3" />
            重置推荐
          </button>
        )}
      </div>

      <div className="p-6 border border-stone-200/90 rounded-3xl bg-[#FDFBF7] shadow-sm">
        {/* ---- 交互式调节滑块 ---- */}
        <div className="mb-5 p-4 rounded-2xl bg-[#FAF7F0] border border-stone-200/80">
          <div className="flex items-center justify-between text-xs font-bold text-stone-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-emerald-700" />
              预算微调模拟器
            </span>
            <span className="text-emerald-800 font-bold">
              {Math.round(multiplier * 100)}
              % (
              {multiplier > 1 ? `+¥${currentTotal - initialTotal}` : multiplier < 1 ? `-¥${initialTotal - currentTotal}` : '基准推荐'}
              )
            </span>
          </div>
          <input
            aria-label="预算模拟调节"
            className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-700"
            max="2"
            min="0.5"
            onChange={e => setMultiplier(Number.parseFloat(e.target.value))}
            step="0.05"
            type="range"
            value={multiplier}
          />
          <div className="flex justify-between text-[10px] text-stone-400 font-bold mt-1">
            <span>0.5x 紧凑型</span>
            <span>1.0x 智能推荐</span>
            <span>2.0x 奢享型</span>
          </div>
        </div>

        {/* ---- 数值表格 ---- */}
        <table className="w-full border-collapse">
          <tbody>
            {budgetKeys.map(key => (
              <tr
                className="border-b border-dashed border-stone-200/80 last:border-b-0"
                key={key}
              >
                <th className="py-2.5 text-stone-700 text-sm font-bold text-left whitespace-nowrap">
                  {labels[key]}
                </th>
                <td className="py-2.5 text-emerald-800 font-serif text-base font-bold tabular-nums text-right whitespace-nowrap">
                  ¥
                  {currentData[key] || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ---- 柱状图可视化 ---- */}
        <div
          className="mt-4 pt-4 border-t border-stone-200/80 space-y-2.5"
        >
          {budgetKeys.map(key => (
            <div className="flex items-center gap-3" key={key}>
              <span className="w-9 shrink-0 text-stone-500 text-xs font-medium text-right">
                {labels[key]}
              </span>
              <div
                className="flex-1 h-2.5 overflow-hidden rounded-full bg-stone-200/60"
              >
                <motion.div
                  animate={{ width: `${((currentData[key] || 0) / max) * 100}%` }}
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: barColors[key],
                  }}
                  transition={{ damping: 20, stiffness: 300, type: 'spring' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* ---- 评级与总计行 ---- */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 py-3.5 px-4.5 border border-emerald-200 bg-emerald-50/70 rounded-2xl">
          <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${tierInfo.color}`}>
            {tierInfo.text}
          </span>
          <div className="flex items-baseline justify-between sm:justify-end gap-2 text-stone-900">
            <span className="text-xs font-bold text-stone-600">模拟预估总花费:</span>
            <span className="text-emerald-800 font-serif text-2xl font-black tabular-nums">
              ¥
              {currentTotal}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
