/**
 * 历史记录页面
 * 展示用户之前生成的所有行程记录，支持查看详情和删除
 */
import type { HistoryRecord } from '@/types'
import { Dialog, Toast } from 'antd-mobile'
import { UnorderedListOutline } from 'antd-mobile-icons'
import { useState } from 'react'
import { BudgetTable } from '@/components/BudgetTable'
import { SpotItem } from '@/components/SpotItem'
import { deleteHistoryRecord, loadHistory } from '@/utils/storage'

export default function History() {
  // 使用 useState 初始化函数从 localStorage 加载历史记录
  const [records, setRecords] = useState<HistoryRecord[]>(() => loadHistory())
  const [expandedCard, setExpandedCard] = useState<number | null>(null) // 当前展开的卡片索引
  const [expandedDays, setExpandedDays] = useState<string[]>([]) // 当前展开的日期列表

  /**
   * 切换卡片展开/收起状态
   * @param index - 卡片索引
   */
  function toggleCard(index: number) {
    setExpandedCard(expandedCard === index ? null : index) // 切换展开状态
    setExpandedDays([]) // 切换卡片时重置展开的日期
  }

  /**
   * 删除历史记录
   * @param index - 要删除的记录索引
   */
  async function deleteRecord(index: number) {
    const result = await Dialog.confirm({ content: '确定要删除这条历史记录吗？' })
    if (result) {
      deleteHistoryRecord(index) // 从 localStorage 删除
      setRecords(prev => prev.filter((_, i) => i !== index)) // 从状态中移除
      Toast.show({ content: '已删除' })
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--c-paper)' }}>
      {/* 页面头部 */}
      <div className="px-6 pt-6 pb-8 md:pt-8 md:pb-10" style={{ background: 'linear-gradient(160deg, var(--c-forest) 0%, #2d6a4f 100%)' }}>
        <p className="mb-2 text-[10px] font-semibold tracking-[3px]" style={{ color: 'var(--c-gold-light)' }}>TRAVEL HISTORY</p>
        <h1 className="mb-1.5 text-[26px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-cream)' }}>历史记录</h1>
        <p className="text-[13px] font-light" style={{ color: 'rgba(253, 246, 236, 0.7)' }}>你的每一次旅程</p>
      </div>

      {/* 空状态 - 无历史记录时显示 */}
      {!records.length && (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--c-sand)' }}>
            <UnorderedListOutline style={{ fontSize: '48px', color: 'var(--c-gold)' }} />
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', color: 'var(--c-ink)' }}>暂无历史记录</p>
          <p className="text-[13px]" style={{ color: 'var(--c-ink-light)' }}>去首页规划一次旅行吧</p>
        </div>
      )}

      {/* 历史记录列表 */}
      {records.length > 0 && (
        <div className="flex flex-col gap-3 p-4 md:p-6 md:grid md:grid-cols-2 md:gap-5 md:max-w-4xl md:mx-auto">
          {records.map((record, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'var(--c-white)', boxShadow: '0 2px 8px rgba(45, 42, 38, 0.05)' }}>
              {/* 记录卡片头部 - 点击展开/收起 */}
              <div onClick={() => toggleCard(i)} className="flex items-center px-[18px] py-4 cursor-pointer active:bg-[var(--c-paper)]">
                <div className="flex-1">
                  <h3 className="mb-1.5 text-[17px] font-bold" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>{record.city}</h3>
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--c-ink-light)' }}>
                    <span>
                      {record.days}
                      天
                    </span>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--c-paper-dark)' }} />
                    <span>
                      ¥
                      {record.budget}
                    </span>
                    <span className="w-[3px] h-[3px] rounded-full" style={{ background: 'var(--c-paper-dark)' }} />
                    <span>{record.date}</span>
                  </div>
                </div>
                {/* 展开/收起箭头 */}
                <span className="shrink-0 ml-3 text-xs" style={{ color: '#999', transform: expandedCard === i ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>

              {/* 展开的详情内容 */}
              {expandedCard === i && (
                <div className="border-t p-3" style={{ borderColor: 'var(--c-paper-dark)' }}>
                  {/* 每日行程列表 */}
                  {record.itinerary?.map(day => (
                    <div key={day.day} className="mb-2">
                      {/* 日期标题 - 点击展开/收起 */}
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
                      {/* 展开的景点详情 */}
                      {expandedDays.includes(String(day.day)) && (
                        <div className="px-2 pt-2">
                          <SpotItem period="上午" data={day.morning} />
                          <SpotItem period="下午" data={day.afternoon} />
                          <SpotItem period="晚上" data={day.evening} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* 预算明细 */}
                  {record.budgetBreakdown && <BudgetTable data={record.budgetBreakdown} />}

                  {/* 旅行提示 */}
                  {record.tips && record.tips.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 py-2 px-1" style={{ fontFamily: 'var(--font-serif)', fontSize: '14px', fontWeight: 600, color: 'var(--c-ink)' }}>
                        <div className="w-[5px] h-[5px] rounded-full" style={{ background: 'var(--c-terracotta)' }} />
                        <span>温馨提示</span>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'var(--c-paper)' }}>
                        {record.tips.map((tip, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs leading-relaxed py-1" style={{ color: 'var(--c-ink-light)' }}>
                            <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: 'var(--c-gold)' }} />
                            {tip}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* 删除按钮 */}
                  <div className="flex justify-end pt-3 px-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteRecord(i) }} // 阻止事件冒泡，避免触发卡片展开
                      className="px-3 py-1.5 rounded-full text-xs border-none cursor-pointer"
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
