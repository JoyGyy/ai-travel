/**
 * 历史记录页面
 * 展示用户之前生成的所有行程记录，支持查看详情和删除
 */
import { Dialog, Toast } from 'antd-mobile'
import { UnorderedListOutline } from 'antd-mobile-icons'
import { useState } from 'react'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { useHistoryStore } from '@/stores/history'

export default function History() {
  const { records, deleteRecord } = useHistoryStore()
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [expandedDays, setExpandedDays] = useState<string[]>([])

  function toggleCard(index: number) {
    setExpandedCard(expandedCard === index ? null : index)
    setExpandedDays([])
  }

  async function handleDelete(index: number) {
    const result = await Dialog.confirm({ content: '确定要删除这条历史记录吗？' })
    if (result) {
      deleteRecord(index)
      Toast.show({ content: '已删除' })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--c-paper)' }}>
      <div className="px-6 pt-6 pb-8 md:pt-8 md:pb-10" style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #2d6a4f 100%)' }}>
        <p className="mb-2 text-[10px] font-semibold tracking-[4px]" style={{ color: 'var(--c-gold-light)' }}>TRAVEL HISTORY</p>
        <h1 className="mb-1.5 text-[26px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>历史记录</h1>
        <p className="text-[13px] font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>你的每一次旅程</p>
      </div>

      {!records.length && (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center animate-[pulseGlow_2s_ease-in-out_infinite]" style={{ background: 'var(--c-sand)' }}>
            <UnorderedListOutline style={{ fontSize: '48px', color: 'var(--c-gold)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--c-ink)' }}>暂无历史记录</p>
          <p className="text-[13px]" style={{ color: 'var(--c-ink-light)' }}>去首页规划一次旅行吧</p>
        </div>
      )}

      {records.length > 0 && (
        <div className="flex flex-col gap-3 p-4 md:p-6 md:grid md:grid-cols-2 md:gap-5 md:max-w-4xl md:mx-auto">
          {records.map((record, i) => (
            <div key={i} className="rounded-2xl overflow-hidden transition-all duration-200 md:hover:-translate-y-0.5 md:hover:shadow-lg" style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-md)' }}>
              <div onClick={() => toggleCard(i)} className="flex items-center px-[18px] py-4 cursor-pointer active:bg-[var(--c-paper)]">
                <div className="flex-1">
                  <h3 className="mb-1.5 text-[17px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>{record.city}</h3>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--c-ink-light)' }}>
                    <span>{record.days}天</span>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--c-paper-dark)' }} />
                    <span>¥{record.budget}</span>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--c-paper-dark)' }} />
                    <span>{record.date}</span>
                  </div>
                </div>
                <span className="shrink-0 ml-3 text-xs transition-transform duration-200" style={{ color: '#999', transform: expandedCard === i ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
              </div>

              {expandedCard === i && (
                <div className="border-t p-3" style={{ borderColor: 'var(--c-paper-dark)' }}>
                  {record.itinerary?.map(day => (
                    <div key={day.day} className="mb-2">
                      <button
                        onClick={() => {
                          setExpandedDays(prev =>
                            prev.includes(String(day.day))
                              ? prev.filter(k => k !== String(day.day))
                              : [...prev, String(day.day)],
                          )
                        }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-left text-sm border-none rounded-lg cursor-pointer"
                        style={{ background: 'var(--c-paper)', color: 'var(--c-ink)', fontWeight: 500 }}
                      >
                        <span>{day.date}</span>
                        <span className="text-xs" style={{ color: '#999' }}>{expandedDays.includes(String(day.day)) ? '▲' : '▼'}</span>
                      </button>
                      {expandedDays.includes(String(day.day)) && (
                        <div className="px-2 pt-2">
                          <SpotItem period="上午" data={day.morning} />
                          <SpotItem period="下午" data={day.afternoon} />
                          <SpotItem period="晚上" data={day.evening} />
                        </div>
                      )}
                    </div>
                  ))}

                  {record.budgetBreakdown && <BudgetTable data={record.budgetBreakdown as any} />}

                  {record.tips && record.tips.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600, color: 'var(--c-ink)' }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--c-terracotta)' }} />
                        <span>温馨提示</span>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'var(--c-white)', boxShadow: 'var(--shadow-sm)' }}>
                        {record.tips.map((tip, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs leading-relaxed py-1" style={{ color: 'var(--c-ink-light)' }}>
                            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--c-gold)' }} />
                            {tip}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-3 px-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(i) }}
                      className="px-3 py-1.5 rounded-full text-xs border-none cursor-pointer transition-colors duration-200 hover:text-[var(--c-error)]"
                      style={{ color: 'var(--c-ink-light)', background: 'var(--c-paper)' }}
                    >
                      删除记录
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
