/**
 * 我的收藏页面
 * 展示用户收藏的行程，支持查看详情和删除
 */
import { Toast } from 'antd-mobile'
import { LeftOutline, StarOutline } from 'antd-mobile-icons'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import type { HistoryRecord } from '@/types'
import { loadCollections } from '@/utils/storage'

export default function Collections() {
  const navigate = useNavigate()
  const [collections, setCollections] = useState<HistoryRecord[]>(() => loadCollections())
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  function handleDelete(index: number) {
    if (!window.confirm('确定要删除这条收藏吗？')) return
    const updated = collections.filter((_, i) => i !== index)
    setCollections(updated)
    localStorage.setItem('travel_collections', JSON.stringify(updated))
    if (expandedIndex === index) setExpandedIndex(null)
    Toast.show({ content: '已删除', position: 'center' })
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      {/* 头部 */}
      <div
        className="relative px-6 pt-5 pb-8 md:pt-8 md:pb-10"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
      >
        <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full" style={{ background: 'rgba(99, 102, 241, 0.06)', filter: 'blur(30px)' }} />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-3.5 left-4 w-9 h-9 rounded-xl flex items-center justify-center border-none cursor-pointer transition-all active:scale-90"
          style={{ background: 'rgba(255, 252, 248, 0.12)' }}
        >
          <LeftOutline style={{ color: 'var(--c-cream)', fontSize: '17px' }} />
        </button>
        <p className="mt-2 mb-2 text-[10px] font-semibold tracking-[4px]" style={{ color: 'var(--c-gold-light)', opacity: 0.75 }}>MY COLLECTIONS</p>
        <h1 className="mb-1 text-[26px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>我的收藏</h1>
        <p className="text-[12px] font-light" style={{ color: 'rgba(253, 246, 236, 0.5)' }}>你收藏的精彩行程</p>
      </div>

      {/* 空状态 */}
      {!collections.length && (
        <div className="flex flex-col items-center py-24 gap-4">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'var(--c-sand)' }}>
            <StarOutline style={{ fontSize: '40px', color: 'var(--c-gold)' }} />
          </div>
          <p className="text-[14px]" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>暂无收藏</p>
          <p className="text-[12px]" style={{ color: 'var(--c-ink-light)' }}>去行程详情页收藏一次旅行吧</p>
        </div>
      )}

      {/* 收藏列表 */}
      {collections.length > 0 && (
        <div className="flex flex-col gap-3 p-4 md:p-6 md:grid md:grid-cols-2 md:gap-4 md:max-w-4xl md:mx-auto md:items-start">
          {collections.map((record, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)', border: '1px solid rgba(240, 232, 221, 0.4)' }}
            >
              {/* 卡片头部 */}
              <div
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                className="flex items-center gap-3 px-5 py-4 cursor-pointer transition-colors active:bg-[var(--c-paper)]"
              >
                <span
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[12px] font-semibold"
                  style={{ background: 'var(--c-sand)', color: 'var(--c-terracotta)' }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="mb-1.5 text-[16px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>
                    {record.city}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--c-ink-light)' }}>
                    <span>{record.days}天</span>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--c-paper-dark)' }} />
                    <span>¥{record.budget}</span>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--c-paper-dark)' }} />
                    <span>{record.date}</span>
                  </div>
                </div>
                <span
                  className="shrink-0 ml-3 text-[10px] transition-transform duration-200"
                  style={{ color: 'var(--c-ink-light)', transform: expandedIndex === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  ▼
                </span>
              </div>

              {/* 展开内容 */}
              {expandedIndex === i && (
                <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'rgba(240, 232, 221, 0.5)' }}>
                  {record.itinerary?.map(day => (
                    <div key={day.day} className="mb-2">
                      <div
                        className="flex items-center px-3 py-2.5 text-sm rounded-xl"
                        style={{ background: 'var(--c-paper)', color: 'var(--c-ink)', fontWeight: 500 }}
                      >
                        {day.date}
                      </div>
                      <div className="px-1 pt-2">
                        <SpotItem period="上午" data={day.morning} />
                        <SpotItem period="下午" data={day.afternoon} />
                        <SpotItem period="晚上" data={day.evening} />
                      </div>
                    </div>
                  ))}

                  {record.budgetBreakdown && <BudgetTable data={record.budgetBreakdown as any} />}

                  {record.tips && record.tips.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '13px', fontWeight: 600, color: 'var(--c-ink)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
                        <span>温馨提示</span>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'var(--c-paper)' }}>
                        {record.tips.map((tip, j) => (
                          <div key={j} className="flex items-start gap-2 text-[12px] leading-relaxed py-1" style={{ color: 'var(--c-ink-light)' }}>
                            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--c-gold)' }} />
                            {tip}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-3 px-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(i) }}
                      className="px-3 py-1.5 rounded-lg text-[11px] border-none cursor-pointer transition-colors"
                      style={{ color: 'var(--c-ink-light)', background: 'var(--c-paper)' }}
                    >
                      取消收藏
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
