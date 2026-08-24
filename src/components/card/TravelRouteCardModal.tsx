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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
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
  const cardRef = useRef<HTMLDivElement>(null)

  const [savingImage, setSavingImage] = useState(false)
  const [sharingCommunity, setSharingCommunity] = useState(false)
  const [copied, setCopied] = useState(false)

  const { city, food, routeString, spots, summary, tips, transportMode } = routeData

  const todayStr = new Date().toLocaleDateString('zh-CN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // 计算路线总里程与耗时
  const totalMetrics = useMemo(() => {
    if (spots.length < 2) {
      return { totalKm: 8, totalTimeText: '约 30 分钟' }
    }
    let totalKm = 0
    let totalMins = 0
    for (let i = 0; i < spots.length - 1; i++) {
      const p1 = getSpotCoordinates(spots[i].name, city, i)
      const p2 = getSpotCoordinates(spots[i + 1].name, city, i + 1)
      const dist = calculateDistanceKm(p1.lat, p1.lng, p2.lat, p2.lng)
      totalKm += dist
      totalMins += estimateDurationMinutes(dist, transportMode)
    }
    return {
      totalKm: Number(totalKm.toFixed(1)),
      totalTimeText: formatMinutesText(totalMins),
    }
  }, [spots, city, transportMode])

  // 1. 保存图片到本地
  async function handleSaveImage() {
    if (!cardRef.current)
      return
    setSavingImage(true)
    try {
      await exportElementToPng(cardRef.current, {
        fileName: `山海行记-${city}手账路线-${new Date().toISOString().slice(0, 10)}.png`,
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
    if (!user) {
      toast.info('请先登录后再分享到旅友社区')
      router.push('/login')
      return
    }

    setSharingCommunity(true)
    try {
      // 构造结构化行程快照
      const snapshot: CommunityItinerarySnapshot = {
        budget: 1500,
        budgetBreakdown: {
          accommodation: 600,
          attractions: 300,
          food: 400,
          total: 1500,
          transport: 200,
        },
        city,
        days: 2,
        itinerary: [
          {
            day: 1,
            spots: spots.slice(0, Math.ceil(spots.length / 2)).map(s => ({
              description: s.description || '特色景点游览与漫步打卡',
              duration: '2小时',
              name: s.name,
            })),
            title: `${city}经典路线打卡`,
          },
          ...(spots.length > 2
            ? [
                {
                  day: 2,
                  spots: spots.slice(Math.ceil(spots.length / 2)).map(s => ({
                    description: s.description || '烟火街巷与特色体验',
                    duration: '2小时',
                    name: s.name,
                  })),
                  title: `${city}烟火漫游与美食探索`,
                },
              ]
            : []),
        ],
      }

      const post = await createCommunityPost({
        city,
        content: `【${city}专属旅行手账】\n\n${summary}\n\n🗺️ 路线规划：${routeString}\n\n🍜 推荐美食：${food.join('、') || '本地特色'}\n\n💡 避坑建议：${tips.join('；') || '提前做好规划'}`,
        itinerarySnapshot: snapshot,
        title: `【${city}旅行手账】${spots.length > 0 ? spots[0].name : city}慢游探索指南`,
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

  // 3. 复制文本路线
  function handleCopyText() {
    const text = `📮【山海行记 · ${city}旅行手账路书】\n\n🗺️ 规划路线：\n${routeString}\n\n🌟 行程建议：\n${summary}\n\n🍜 美食打卡：\n${food.join('、') || '暂无'}\n\n💡 出行指南：\n${tips.join('\n') || '祝旅途愉快'}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('已复制手账路书文字内容！')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog onOpenChange={open => !open && onClose()} open={isOpen}>
      <DialogContent className="max-w-[660px] max-h-[92vh] overflow-y-auto border-none bg-stone-950/40 p-3 sm:p-5 backdrop-blur-md">
        <DialogTitle className="sr-only">山海行记 · 路线卡片生成</DialogTitle>

        <div className="flex flex-col gap-4">
          {/* 卡片实体（待导出为图片的主体） */}
          <div
            className="relative overflow-hidden rounded-[28px] border-2 border-stone-200/90 bg-[#FAF7F0] p-6 sm:p-7 text-stone-900 shadow-2xl"
            ref={cardRef}
          >
            {/* 信纸微点底纹 */}
            <div
              className="absolute inset-0 opacity-[0.45] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#d6d3d1 1px, transparent 1px)`,
                backgroundSize: '18px 18px',
              }}
            />

            {/* 卡片顶栏：品牌与复古印章 */}
            <div className="relative z-1 flex items-start justify-between border-b-2 border-dashed border-stone-300/80 pb-4 mb-5">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 px-3 py-0.5 text-[11px] font-bold text-white shadow-2xs tracking-wider uppercase">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>山海行记 · 旅人手账路书</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight mt-1.5">
                  {city}
                  {' '}
                  · 漫游路线指南
                </h3>
                <p className="text-xs text-stone-500 font-medium mt-0.5">
                  生成于
                  {' '}
                  {todayStr}
                  {' '}
                  · 专属定制
                </p>
              </div>

              {/* 复古旅行邮票 */}
              <div className="flex-shrink-0 rotate-3 rounded-xl border-2 border-dashed border-emerald-700 bg-emerald-50 p-2 text-center shadow-xs">
                <span className="block text-[9px] font-extrabold text-emerald-800 tracking-widest uppercase">PASSPORT</span>
                <span className="font-serif text-sm font-black text-emerald-950">
                  {city}
                </span>
              </div>
            </div>

            {/* 路线拓扑链路图 */}
            {spots.length > 0 && (
              <div className="relative z-1 mb-5 rounded-2xl border border-stone-200/90 bg-white/90 p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3 text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                    <span>
                      游览打卡链路 (
                      {spots.length}
                      {' '}
                      站)
                    </span>
                  </span>
                  <Badge className="bg-emerald-100 text-emerald-800 border-none text-[10px] font-bold" variant="secondary">
                    {transportMode === 'driving' ? '🚗 自驾' : transportMode === 'transit' ? '🚌 公交' : '🚶 慢步'}
                    {' '}
                    ~
                    {totalMetrics.totalKm}
                    {' '}
                    km ·
                    {' '}
                    {totalMetrics.totalTimeText}
                  </Badge>
                </div>

                {/* 水平路线链 */}
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar">
                  {spots.map((spot, idx) => (
                    <div className="flex items-center flex-shrink-0" key={spot.name}>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/80 shadow-2xs">
                        <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-700 text-[11px] font-black text-white">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-stone-800 whitespace-nowrap">
                          {spot.name}
                        </span>
                      </div>
                      {idx < spots.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-emerald-700 mx-1 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 核心建议 / 摘要 */}
            {summary && (
              <div className="relative z-1 mb-4 rounded-2xl bg-amber-50/90 border border-amber-200/70 p-4 text-xs leading-relaxed text-stone-800">
                <div className="flex items-center gap-1.5 font-bold text-amber-950 mb-1">
                  <Compass className="w-4 h-4 text-amber-700" />
                  <span>核心亮点与行程建议</span>
                </div>
                <p className="text-stone-700">{summary}</p>
              </div>
            )}

            {/* 美食推荐 */}
            {food.length > 0 && (
              <div className="relative z-1 mb-4 rounded-2xl bg-white/90 border border-stone-200/90 p-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-2">
                  <Utensils className="w-3.5 h-3.5 text-amber-600" />
                  <span>地道特色美食推荐</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {food.map(f => (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900"
                      key={f}
                    >
                      🍜
                      {' '}
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 避坑贴士 */}
            {tips.length > 0 && (
              <div className="relative z-1 mb-4 rounded-2xl bg-white/90 border border-stone-200/90 p-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-stone-900 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>出行贴士 & 避坑指南</span>
                </div>
                <ul className="space-y-1 text-stone-600">
                  {tips.map(tip => (
                    <li className="flex items-start gap-1.5" key={tip}>
                      <span className="text-emerald-700 font-bold">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 卡片底栏：水印与认证印章 */}
            <div className="relative z-1 flex items-center justify-between border-t border-stone-200 pt-4 mt-2 text-[11px] text-stone-400 font-medium">
              <div className="flex items-center gap-1.5 text-stone-600">
                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                <span>山海行记 · 让每次出发都如手账般值得珍藏</span>
              </div>
              <span className="font-mono text-[10px] text-stone-400">joygytrip.cn</span>
            </div>
          </div>

          {/* 底部操作工具栏 */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl bg-white/95 p-3 px-4 shadow-lg backdrop-blur-md">
            <Button
              className="rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
              onClick={handleCopyText}
              size="sm"
              type="button"
              variant="outline"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
              <span>{copied ? '已复制' : '复制文案'}</span>
            </Button>

            <div className="flex items-center gap-2">
              {/* 保存图片按钮 */}
              <Button
                className="rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-sm"
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
                    <span>保存图片到本地</span>
                  </>
                )}
              </Button>

              {/* 一键分享到社区按钮 */}
              <Button
                className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm shadow-emerald-800/20"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
