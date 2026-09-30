'use client'

import type { ParsedRouteData } from '@/lib/map/route-parser'
import type { CommunityItinerarySnapshot } from '@/types/community'
import {
  Check,
  ChevronRight,
  Compass,
  Copy,
  Download,
  Loader2,
  Navigation,
  Share2,
  Sparkles,
  Utensils,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState } from 'react'

import { createCommunityPost } from '@/api/community'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { useAppToast } from '@/hooks/useAppToast'
import {
  calculateDistanceKm,
  estimateDurationMinutes,
  formatMinutesText,
  getSpotCoordinates,
} from '@/lib/map/amap'
import { exportElementToPng } from '@/lib/utils/export-image'
import { useAuthStore } from '@/stores/auth'

interface TravelRouteCardModalProps {
  isOpen: boolean
  onClose: () => void
  rawText?: string
  routeData: ParsedRouteData
}

export function TravelRouteCardModal({
  isOpen,
  onClose,
  routeData,
}: TravelRouteCardModalProps) {
  const router = useRouter()
  const toast = useAppToast()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)
  const cardRef = useRef<HTMLDivElement>(null)

  const [savingImage, setSavingImage] = useState(false)
  const [sharingCommunity, setSharingCommunity] = useState(false)
  const [copied, setCopied] = useState(false)

  const {
    city = '旅行目的地',
    food = [],
    routeString = '',
    spots = [],
    summary = '',
    tips = [],
    transportMode = 'driving',
  } = routeData || {}

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // 整理按天划分的打卡点数据，区分每一天的具体行程
  const displayDays = useMemo(() => {
    if (Array.isArray(routeData?.days) && routeData.days.length > 0) {
      const valid = routeData.days.filter(
        d => Array.isArray(d.spots) && d.spots.length > 0,
      )
      if (valid.length > 0) {
        return valid
      }
    }
    // 兜底：若无结构化 days 但有 spots，作为单日呈现
    if (Array.isArray(spots) && spots.length > 0) {
      return [
        {
          day: 1,
          spots,
          title: `${city}精选游玩打卡`,
        },
      ]
    }
    return []
  }, [routeData?.days, spots, city])

  // 计算路线总里程与耗时（按天内连续节点累加，避免跨天虚增距离）
  const totalMetrics = useMemo(() => {
    const validSpots = Array.isArray(spots) ? spots : []
    if (validSpots.length < 2) {
      return { totalKm: 8, totalTimeText: '约 30 分钟' }
    }
    let totalKm = 0
    let totalMins = 0

    if (displayDays.length > 0) {
      for (const d of displayDays) {
        const daySpots = d.spots || []
        for (let i = 0; i < daySpots.length - 1; i++) {
          const p1 = getSpotCoordinates(daySpots[i].name, city, i)
          const p2 = getSpotCoordinates(daySpots[i + 1].name, city, i + 1)
          const dist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng)
          totalKm += dist
          totalMins += estimateDurationMinutes(dist, transportMode)
        }
      }
    } else {
      for (let i = 0; i < validSpots.length - 1; i++) {
        const p1 = getSpotCoordinates(validSpots[i].name, city, i)
        const p2 = getSpotCoordinates(validSpots[i + 1].name, city, i + 1)
        const dist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng)
        totalKm += dist
        totalMins += estimateDurationMinutes(dist, transportMode)
      }
    }

    if (totalKm === 0) {
      totalKm = validSpots.length * 3.5
      totalMins = validSpots.length * 20
    }

    return {
      totalKm: Number(totalKm.toFixed(1)),
      totalTimeText: formatMinutesText(totalMins),
    }
  }, [spots, displayDays, city, transportMode])

  // 1. 保存图片到本地
  async function handleSaveImage() {
    if (!cardRef.current)
      return
    setSavingImage(true)
    try {
      await exportElementToPng(cardRef.current, {
        fileName: `远方-${city}手账路线-${new Date().toISOString().slice(0, 10)}.png`,
        pixelRatio: 2,
      })
      toast.success('✨ 手账卡片已成功保存至本地相册/下载！')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '保存图片失败')
    }
    finally {
      setSavingImage(false)
    }
  }

  // 2. 一键分享发布到社区
  async function handleShareToCommunity() {
    if (!hasHydrated) {
      toast.info('正在验证登录信息...')
      return
    }
    if (!user) {
      toast.info('请先登录后再分享到旅友社区')
      router.push('/login')
      return
    }

    setSharingCommunity(true)
    try {
      const safeCity = (city || '旅行目的地').trim()
      const safeFood = Array.isArray(food) ? food : []
      const safeTips = Array.isArray(tips) ? tips : []

      // 构造结构化分日行程安排
      const itineraryDays = displayDays.map(d => ({
        day: d.day,
        spots: d.spots.map((s, idx) => ({
          description: s.description || '特色景点游览与漫步打卡',
          duration: s.durationText || '2小时',
          name: s.name || `景点 ${idx + 1}`,
        })),
        title: d.title?.replace(/^#+\s*/, '') || `${safeCity}第 ${d.day} 天漫游`,
      }))

      const daysCount = Math.max(1, displayDays.length)
      const totalBudget = daysCount * 750

      // 构造结构化行程快照
      const snapshot: CommunityItinerarySnapshot = {
        budget: totalBudget,
        budgetBreakdown: {
          accommodation: Math.round(totalBudget * 0.4),
          attractions: Math.round(totalBudget * 0.2),
          food: Math.round(totalBudget * 0.25),
          total: totalBudget,
          transport: Math.round(totalBudget * 0.15),
        },
        city: safeCity,
        days: daysCount,
        itinerary: itineraryDays,
        tips: safeTips,
      }

      const firstSpotName = spots.length > 0 && spots[0].name ? spots[0].name : safeCity
      const title = `【${safeCity}${daysCount > 1 ? ` ${daysCount}日游` : ''}手账】${firstSpotName}慢游探索指南`.slice(0, 80)

      let routeContentStr = ''
      if (displayDays.length > 1) {
        routeContentStr = displayDays
          .map(d => `Day ${d.day}：${d.spots.map(s => s.name).join(' ➔ ')}`)
          .join('\n')
      } else {
        routeContentStr = routeString || spots.map(s => s.name).join(' ➔ ')
      }

      const content = `【${safeCity}专属旅行手账】\n\n${summary || '精心规划的专属旅行路线。'}\n\n🗺️ 路线规划：\n${routeContentStr || safeCity}\n\n🍜 推荐美食：${safeFood.join('、') || '本地特色小吃'}\n\n💡 避坑建议：${safeTips.join('；') || '提前做好规划与预约'}`.slice(0, 2000)

      const post = await createCommunityPost({
        city: safeCity.slice(0, 50),
        content,
        images: [],
        itinerarySnapshot: snapshot,
        title,
      })

      toast.success('🎉 已成功发布到社区广场！')
      onClose()
      router.push(`/community/${post.id}`)
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '分享到社区失败')
    }
    finally {
      setSharingCommunity(false)
    }
  }

  // 3. 复制文本路线（支持分日结构输出）
  function handleCopyText() {
    const safeFood = Array.isArray(food) ? food : []
    const safeTips = Array.isArray(tips) ? tips : []

    let routeDesc = ''
    if (displayDays.length > 1) {
      routeDesc = displayDays
        .map(d => `【Day ${d.day} · ${d.title?.replace(/^#+\s*/, '')}】\n${d.spots.map((s, idx) => `${idx + 1}. ${s.name}${s.durationText ? ` (${s.durationText})` : ''}`).join(' ➔ ')}`)
        .join('\n\n')
    } else {
      routeDesc = routeString || spots.map(s => s.name).join(' ➔ ')
    }

    const text = `📮【远方 · ${city}旅行手账路书】\n\n🗺️ 规划路线：\n${routeDesc}\n\n🌟 行程建议：\n${summary}\n\n🍜 美食打卡：\n${safeFood.join('、') || '暂无'}\n\n💡 出行指南：\n${safeTips.join('\n') || '祝旅途愉快'}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('已复制手账路书文字内容！')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog onOpenChange={open => !open && onClose()} open={isOpen}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[90vh] flex flex-col p-0 overflow-hidden border border-stone-200/90 rounded-[28px] bg-[#FAF7F0] shadow-2xl">
        {/* 1. 顶部固定导航栏 */}
        <div className="flex items-center justify-between border-b border-stone-200/80 bg-white/95 px-6 py-3.5 shrink-0 pr-16 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <Sparkles className="h-4 w-4 text-amber-300" />
            </div>
            <div>
              <DialogTitle className="text-sm sm:text-base font-bold font-serif text-stone-900 leading-tight">
                手账旅行路书导出与分享
              </DialogTitle>
              <DialogDescription className="text-xs text-stone-500 font-medium">
                {city} · {displayDays.length > 1 ? `${displayDays.length} 天行程规划` : '精选漫游路线'} · 共 {spots.length} 处精选打卡点
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* 2. 中间卡片预览滚动区 */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 lg:p-8 bg-stone-900/5 flex justify-center">
          {/* 卡片实体（待导出为图片的主体） */}
          <div
            className="relative overflow-hidden rounded-[32px] border-2 border-stone-200/90 bg-[#FAF7F0] p-6 sm:p-8 lg:p-10 text-stone-900 shadow-xl max-w-3xl w-full h-fit"
            ref={cardRef}
          >
            {/* 信纸微点底纹 */}
            <div
              className="absolute inset-0 opacity-[0.45] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#d6d3d1 1px, transparent 1px)`,
                backgroundSize: '20px 20px',
              }}
            />

            {/* 卡片顶栏：品牌与复古印章 */}
            <div className="relative z-1 flex items-start justify-between border-b-2 border-dashed border-stone-300/80 pb-5 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3.5 py-1 text-xs font-bold text-white shadow-2xs tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>远方 · 旅人手账路书</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-stone-900 tracking-tight mt-2.5">
                  {city} · 漫游路线指南
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 font-medium mt-1">
                  生成于 {todayStr} · 专属定制旅行路书
                </p>
              </div>

              {/* 复古旅行邮票 */}
              <div className="flex-shrink-0 rotate-3 rounded-2xl border-2 border-dashed border-emerald-700 bg-emerald-50 px-3.5 py-2 text-center shadow-xs">
                <span className="block text-[10px] font-extrabold text-emerald-800 tracking-widest uppercase">
                  PASSPORT
                </span>
                <span className="font-serif text-base sm:text-lg font-black text-emerald-950">
                  {city}
                </span>
              </div>
            </div>

            {/* 游览打卡链路（区分每一天） */}
            {displayDays.length > 0 && (
              <div className="relative z-1 mb-6 rounded-2xl border border-stone-200/90 bg-white/95 p-5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-sm font-bold text-emerald-900 border-b border-stone-100 pb-3">
                  <span className="flex items-center gap-2 text-sm sm:text-base font-serif">
                    <Navigation className="w-4 h-4 text-emerald-700" />
                    <span>
                      游览打卡链路 ({displayDays.length > 1 ? `${displayDays.length} 天 · ` : ''}共 {spots.length} 站精选路线)
                    </span>
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-xs font-bold px-3 py-1" variant="secondary">
                    {transportMode === 'driving' ? '🚗 自驾' : transportMode === 'transit' ? '🚌 公交' : '🚶 慢步'}
                    {' '}
                    ~{totalMetrics.totalKm} km · {totalMetrics.totalTimeText}
                  </Badge>
                </div>

                {/* 按天分组展示打卡点 */}
                <div className="space-y-3.5">
                  {displayDays.map(d => (
                    <div
                      key={d.day}
                      className="rounded-2xl border border-stone-200/80 bg-[#FAF7F0]/80 p-3.5 sm:p-4 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-lg bg-emerald-800 text-white text-xs font-black tracking-wider shadow-2xs">
                            Day {d.day}
                          </span>
                          <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900">
                            {d.title?.replace(/^#+\s*/, '') || `第 ${d.day} 天行程`}
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {d.spots.length} 处打卡点
                        </span>
                      </div>

                      {/* 单日打卡点拓扑链 (自动换行排列，完整导出不截断) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {d.spots.map((spot, sIdx) => (
                          <div className="flex items-center" key={`${d.day}-${spot.name}-${sIdx}`}>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-200/90 shadow-2xs hover:border-emerald-500/40 transition-colors">
                              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-700 text-[11px] font-black text-white shrink-0">
                                {sIdx + 1}
                              </span>
                              <span className="text-xs font-bold text-stone-800 whitespace-nowrap">
                                {spot.name}
                              </span>
                              {spot.durationText && (
                                <span className="text-[10px] text-stone-400 font-medium">
                                  {spot.durationText}
                                </span>
                              )}
                            </div>
                            {sIdx < d.spots.length - 1 && (
                              <ChevronRight className="w-3.5 h-3.5 text-emerald-700 mx-1 shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 核心亮点与行程建议 */}
            {summary && (
              <div className="relative z-1 mb-5 rounded-2xl bg-amber-50/90 border border-amber-200/70 p-5 text-sm leading-relaxed text-stone-800">
                <div className="flex items-center gap-2 font-bold text-amber-950 mb-1.5 text-base">
                  <Compass className="w-4.5 h-4.5 text-amber-700" />
                  <span>核心亮点与行程建议</span>
                </div>
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed">{summary}</p>
              </div>
            )}

            {/* 地道特色美食推荐 */}
            {food.length > 0 && (
              <div className="relative z-1 mb-5 rounded-2xl bg-white/90 border border-stone-200/90 p-5 text-sm">
                <div className="flex items-center gap-2 font-bold text-stone-900 mb-2.5 text-base">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span>地道特色美食推荐</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {food.map(f => (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-xs sm:text-sm font-bold text-amber-900"
                      key={f}
                    >
                      🍜 {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 出行贴士 & 避坑指南 */}
            {tips.length > 0 && (
              <div className="relative z-1 mb-5 rounded-2xl bg-white/90 border border-stone-200/90 p-5 text-sm">
                <div className="flex items-center gap-2 font-bold text-stone-900 mb-2 text-base">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>出行贴士 & 避坑指南</span>
                </div>
                <ul className="space-y-1.5 text-stone-600 text-sm sm:text-base">
                  {tips.map(tip => (
                    <li className="flex items-start gap-2" key={tip}>
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 卡片底栏：水印与认证印章 */}
            <div className="relative z-1 flex items-center justify-between border-t border-stone-200 pt-5 mt-4 text-xs text-stone-400 font-medium">
              <div className="flex items-center gap-1.5 text-stone-600">
                <Compass className="w-4 h-4 text-emerald-700" />
                <span className="text-xs sm:text-sm">远方 · 让每次出发都如手账般值得珍藏</span>
              </div>
              <span className="font-mono text-xs text-stone-400">joygytrip.cn</span>
            </div>
          </div>
        </div>

        {/* 3. 底部固定操作栏 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200/90 bg-white/98 px-5 py-3.5 shrink-0 shadow-lg backdrop-blur-md">
          <Button
            className="rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-100 cursor-pointer"
            onClick={handleCopyText}
            size="sm"
            type="button"
            variant="outline"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1" />
            )}
            <span>{copied ? '已复制文案' : '复制路书文案'}</span>
          </Button>

          <div className="flex items-center gap-2">
            {/* 保存图片按钮 */}
            <Button
              className="rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-sm cursor-pointer"
              disabled={savingImage}
              onClick={handleSaveImage}
              size="sm"
              type="button"
            >
              {savingImage ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>生成高清图中...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  <span>保存卡片到本地</span>
                </>
              )}
            </Button>

            {/* 一键分享到社区按钮 */}
            <Button
              className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm shadow-emerald-800/20 cursor-pointer"
              disabled={sharingCommunity}
              onClick={handleShareToCommunity}
              size="sm"
              type="button"
            >
              {sharingCommunity ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  <span>发布中...</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  <span>一键分享到社区</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
