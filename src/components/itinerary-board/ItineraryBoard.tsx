'use client'

import React, { useMemo, useState } from 'react'
import {
  Calendar,
  Check,
  ChevronRight,
  Edit2,
  FileText,
  Inbox,
  LayoutGrid,
  List,
  MapPin,
  Plus,
  Route,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace'
import { CommuteTimelineSegment } from './CommuteTimelineSegment'
import { ItinerarySpotCard } from './ItinerarySpotCard'

interface ItineraryBoardProps {
  className?: string
  onExportCard?: () => void
}

export function ItineraryBoard({ className = '' }: ItineraryBoardProps) {
  const city = useItineraryWorkspaceStore(s => s.city)
  const days = useItineraryWorkspaceStore(s => s.days)
  const selectedDay = useItineraryWorkspaceStore(s => s.selectedDay)
  const setSelectedDay = useItineraryWorkspaceStore(s => s.setSelectedDay)
  const addDay = useItineraryWorkspaceStore(s => s.addDay)
  const unassignedSpots = useItineraryWorkspaceStore(s => s.unassignedSpots)
  const addFromUnassignedToDay = useItineraryWorkspaceStore(s => s.addFromUnassignedToDay)
  const updateDayNotes = useItineraryWorkspaceStore(s => s.updateDayNotes)
  const viewMode = useItineraryWorkspaceStore(s => s.viewMode)
  const setViewMode = useItineraryWorkspaceStore(s => s.setViewMode)

  const [isEditingNotes, setIsEditingNotes] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')

  // 当前激活的单日行程对象 (selectedDay > 0)
  const currentDay = useMemo(() => {
    return days.find(d => d.day === selectedDay) || null
  }, [days, selectedDay])

  // 当前日统计指标
  const metrics = useMemo(() => {
    if (!currentDay || currentDay.spots.length === 0) {
      return null
    }
    const spotCount = currentDay.spots.length
    const totalDistance = currentDay.legs.reduce((acc, leg) => acc + leg.distanceKm, 0)
    const totalCommuteMinutes = currentDay.legs.reduce((acc, leg) => acc + leg.durationMins, 0)
    return {
      commuteText: totalCommuteMinutes > 0 ? `通勤约 ${totalCommuteMinutes} 分钟` : '起止点邻近',
      distanceText: totalDistance > 0 ? `全程约 ${totalDistance.toFixed(1)} km` : '步行可达',
      spotCount: `共 ${spotCount} 处打卡点`,
    }
  }, [currentDay])

  const handleSaveNotes = () => {
    if (currentDay) {
      updateDayNotes(currentDay.day, noteDraft)
    }
    setIsEditingNotes(false)
  }

  return (
    <div className={`flex flex-col h-full bg-[#FDFBF7] ${className}`}>
      {/* 1. 顶栏：多天控制器 (对标携程: [总览] [第1天] [第2天] ... [待安排] [+]) */}
      <div className="border-b border-stone-200/90 bg-white px-3 py-2.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* 总览 Tab */}
            <button
              className={`
                px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer
                ${selectedDay === 0
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'}
              `}
              onClick={() => setSelectedDay(0)}
              type="button"
            >
              总览
            </button>

            {/* 各天 Tab */}
            {days.map(d => (
              <button
                className={`
                  px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer
                  ${selectedDay === d.day
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'}
                `}
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                type="button"
              >
                第
                {d.day}
                天
              </button>
            ))}

            {/* 待安排 Tab */}
            <button
              className={`
                px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1
                ${selectedDay === -1
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'}
              `}
              onClick={() => setSelectedDay(-1)}
              type="button"
            >
              <span>待安排</span>
              {unassignedSpots.length > 0 && (
                <span
                  className={`
                    px-1.5 py-0.2 rounded-full text-[10px] font-black
                    ${selectedDay === -1 ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-700'}
                  `}
                >
                  {unassignedSpots.length}
                </span>
              )}
            </button>

            {/* 新增天数按钮 */}
            <button
              className="flex h-7 w-7 items-center justify-center rounded-xl border border-dashed border-stone-300 text-stone-500 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
              onClick={addDay}
              title="新增一天行程"
              type="button"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 视图模式切换 */}
          <div className="flex items-center gap-1 shrink-0 border-l border-stone-200 pl-2">
            <button
              className={`p-1.5 rounded-lg text-stone-500 hover:text-stone-900 cursor-pointer ${viewMode === 'cards' ? 'bg-emerald-50 text-emerald-700' : ''}`}
              onClick={() => setViewMode('cards')}
              title="卡片流模式"
              type="button"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              className={`p-1.5 rounded-lg text-stone-500 hover:text-stone-900 cursor-pointer ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-700' : ''}`}
              onClick={() => setViewMode('list')}
              title="列表模式"
              type="button"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. 主体内容滚动区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {days.length === 0 ? (
          /* 空白引导页 */
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100/70 text-emerald-800 mb-3 shadow-2xs">
              <Route className="h-7 w-7" />
            </div>
            <h3 className="font-serif text-base font-bold text-stone-800">
              等待生成智能行程看板
            </h3>
            <p className="mt-1.5 max-w-xs text-xs text-stone-500 leading-relaxed">
              在左侧告诉 AI 您想去的城市与游玩天数，生成完毕后将在此呈现如携程般精美的多日编排与动线图景。
            </p>
          </div>
        ) : selectedDay === -1 ? (
          /* 待安排池 */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div className="flex items-center gap-1.5 font-bold text-stone-900 text-sm">
                <Inbox className="h-4 w-4 text-amber-600" />
                <span>待安排景点 & 灵感池</span>
              </div>
              <span className="text-xs text-stone-500">
                共
                {' '}
                {unassignedSpots.length}
                {' '}
                个待定点
              </span>
            </div>

            {unassignedSpots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-xs text-stone-400">
                暂无待安排景点，卡片菜单中可将不确定的点移入此处备选。
              </div>
            ) : (
              <div className="space-y-2">
                {unassignedSpots.map((spot, idx) => (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white p-3 shadow-2xs"
                    key={spot.id}
                  >
                    <div>
                      <h4 className="font-bold text-stone-900 text-xs">{spot.name}</h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">{spot.recommendedDuration || '建议 1-2 小时'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {days.map(d => (
                        <button
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                          key={d.day}
                          onClick={() => addFromUnassignedToDay(idx, d.day)}
                          type="button"
                        >
                          + 第
                          {d.day}
                          天
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : selectedDay === 0 ? (
          /* 总览模式 (Overview) */
          <div className="space-y-5">
            <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <span>
                    【
                    {city}
                    】
                    {days.length}
                    天完整行程总览
                  </span>
                </h3>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  共
                  {' '}
                  {days.reduce((acc, d) => acc + d.spots.length, 0)}
                  {' '}
                  个打卡点
                </span>
              </div>
            </div>

            {/* 逐天展开 */}
            <div className="space-y-4">
              {days.map(d => (
                <div
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs space-y-3 cursor-pointer hover:border-emerald-500 transition-colors"
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <span className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-700 text-[10px] font-black text-white">
                        D
                        {d.day}
                      </span>
                      <span>{d.title}</span>
                    </span>
                    <span className="text-[11px] text-stone-400 flex items-center gap-0.5">
                      查看详情
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {d.spots.map((sp, sIdx) => (
                      <span
                        className="inline-flex items-center gap-1 rounded-xl bg-stone-50 border border-stone-200/80 px-2 py-1 text-xs text-stone-700"
                        key={sp.id}
                      >
                        <span className="font-black text-emerald-700">{sIdx + 1}</span>
                        <span>{sp.name}</span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* 单日详情模式 (Selected Day) */
          currentDay && (
            <div className="space-y-4">
              {/* 单日头部信息 */}
              <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-2.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-sm font-bold text-stone-900">
                      第
                      {currentDay.day}
                      天 ·
                      {' '}
                      {currentDay.title}
                    </h3>
                    {metrics && (
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mt-1">
                        <span>{metrics.spotCount}</span>
                        <span>•</span>
                        <span>{metrics.distanceText}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-semibold">{metrics.commuteText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 备注区 */}
                <div className="pt-2 border-t border-stone-100">
                  {isEditingNotes ? (
                    <div className="space-y-2">
                      <textarea
                        className="w-full rounded-xl border border-stone-300 p-2 text-xs focus:border-emerald-600 focus:outline-none"
                        onChange={e => setNoteDraft(e.target.value)}
                        placeholder="记录今天的出游提醒、着装建议或必吃小吃..."
                        rows={2}
                        value={noteDraft}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          className="rounded-lg px-2.5 py-1 text-xs text-stone-500 hover:bg-stone-100"
                          onClick={() => setIsEditingNotes(false)}
                          type="button"
                        >
                          取消
                        </button>
                        <button
                          className="rounded-lg bg-emerald-700 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-800"
                          onClick={handleSaveNotes}
                          type="button"
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center justify-between text-xs text-stone-500 hover:text-stone-800 cursor-pointer group"
                      onClick={() => {
                        setNoteDraft(currentDay.notes || '')
                        setIsEditingNotes(true)
                      }}
                    >
                      <span className="italic truncate">
                        {currentDay.notes ? `📝 备注：${currentDay.notes}` : '+ 添加当日行程备注'}
                      </span>
                      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>

              {/* 景点节点时间线 */}
              <div className="relative pt-1 space-y-1">
                {currentDay.spots.map((spot, sIdx) => {
                  const leg = currentDay.legs[sIdx]
                  const isLast = sIdx === currentDay.spots.length - 1

                  return (
                    <React.Fragment key={spot.id}>
                      <ItinerarySpotCard
                        canMoveDown={sIdx < currentDay.spots.length - 1}
                        canMoveUp={sIdx > 0}
                        city={city}
                        dayNum={currentDay.day}
                        index={sIdx}
                        isTotalLast={isLast}
                        spot={spot}
                      />

                      {/* 节点间通勤条 (仅在非末尾节点后渲染) */}
                      {!isLast && leg && (
                        <CommuteTimelineSegment city={city} leg={leg} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
