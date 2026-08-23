'use client'

import { motion } from 'framer-motion'
import { Check, Copy, MapPin, Sparkles, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useAppToast } from '@/hooks/useAppToast'

interface FlipPostcardModalProps {
  budget: number
  city: string
  days: number
  isOpen: boolean
  onClose: () => void
}

export function FlipPostcardModal({
  budget,
  city,
  days,
  isOpen,
  onClose,
}: FlipPostcardModalProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [copied, setCopied] = useState(false)
  const toast = useAppToast()

  const handleCopy = () => {
    const text = `📮 收到一张来自「${city}」的 AI 旅行手账明信片！\n🗓️ 行程：${days}天深度漫游\n💰 预算预估：¥${budget}\n🌿 立即查看专属路书：${typeof window !== 'undefined' ? window.location.href : ''}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('已复制手账明信片内容到剪贴板！')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog onOpenChange={open => !open && onClose()} open={isOpen}>
      <DialogContent className="max-w-[620px] border-none bg-transparent p-4 shadow-none sm:p-6">
        <DialogTitle className="sr-only">旅人手账明信片</DialogTitle>

        <div className="flex flex-col items-center">
          {/* 3D 翻转卡片容器 */}
          <div
            className="h-[360px] w-full max-w-[500px] cursor-pointer sm:h-[400px]"
            onClick={() => setIsFlipped(prev => !prev)}
            style={{ perspective: 1000 }}
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              className="relative h-full w-full rounded-3xl shadow-2xl"
              style={{ transformStyle: 'preserve-3d' }}
              transition={{ damping: 20, duration: 0.6, stiffness: 200 }}
            >
              {/* 正面：实景风景照片 + 邮票手账风 */}
              <div
                className="absolute inset-0 overflow-hidden rounded-3xl border-4 border-white bg-stone-900 shadow-xl"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <Image
                  alt={city}
                  className="object-cover"
                  fill
                  src="/images/home/hero-boat.jpg"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-stone-950/40" />

                {/* 右上角复古邮票 */}
                <div className="absolute right-4 top-4 rounded-lg border-2 border-dashed border-white/80 bg-amber-600/90 p-2 text-center text-white backdrop-blur-md shadow-md">
                  <span className="block text-[9px] font-bold uppercase tracking-widest">AIR MAIL</span>
                  <span className="font-serif text-sm font-black">
                    ¥
                    {budget}
                  </span>
                </div>

                {/* 正面底部文字 */}
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <div className="mb-1 inline-flex items-center gap-1 rounded-full bg-emerald-700/80 px-2.5 py-0.5 text-xs font-bold backdrop-blur-md">
                    <MapPin className="h-3 w-3" />
                    <span>
                      {city}
                      {' '}
                      · 旅行明信片
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl font-black drop-shadow-sm sm:text-3xl">
                    去山海之间，给时光留白
                  </h3>
                  <p className="mt-1 text-xs text-stone-200">
                    {days}
                    {' '}
                    天定制行程 · 专属 AI 旅行手账
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-[11px] font-bold text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    点击卡片翻转，查看反面手账路线 ➔
                  </p>
                </div>
              </div>

              {/* 反面：复古旅行明信片书写面 */}
              <div
                className="absolute inset-0 rounded-3xl border-4 border-stone-200/80 bg-[#FAF7F0] p-6 shadow-xl text-stone-900 flex flex-col justify-between"
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {/* 顶部标题 */}
                <div className="flex items-center justify-between border-b border-stone-300/80 pb-3">
                  <div>
                    <span className="font-serif italic text-xs tracking-widest text-amber-800">
                      POSTCARD FROM DISTANCE
                    </span>
                    <h4 className="font-serif text-base font-extrabold text-stone-900">
                      {city}
                      {' '}
                      · 手账漫游路线备忘
                    </h4>
                  </div>
                  {/* 印章 */}
                  <div className="rounded-xl border border-red-600 bg-red-50 px-2.5 py-1 text-center text-red-700">
                    <span className="block text-[8px] font-black tracking-widest">VERIFIED</span>
                    <span className="text-xs font-bold">手账留念</span>
                  </div>
                </div>

                {/* 中间左右分栏 */}
                <div className="grid grid-cols-2 gap-4 my-auto">
                  {/* 左侧：行程要点 */}
                  <div className="space-y-1.5 text-xs leading-relaxed text-stone-700">
                    <p className="font-bold text-emerald-800">🌿 行程手记：</p>
                    <p>
                      • 目的地：
                      {city}
                    </p>
                    <p>
                      • 游玩周期：
                      {days}
                      {' '}
                      天精选路线
                    </p>
                    <p>
                      • 预算控制：约 ¥
                      {budget}
                      {' '}
                      元
                    </p>
                    <p className="italic text-stone-500 mt-2">“山不见我，我自去看山。”</p>
                  </div>

                  {/* 右侧：邮寄信息 */}
                  <div className="border-l border-stone-300/80 pl-4 flex flex-col justify-center space-y-2 text-xs">
                    <div className="border-b border-stone-300 pb-1 text-stone-600">
                      寄件人：AI 专属旅行助手
                    </div>
                    <div className="border-b border-stone-300 pb-1 text-stone-600">
                      收件人：热爱生活的旅人
                    </div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      POST CODE: 2026-
                      {Math.floor(Math.random() * 8999 + 1000)}
                    </div>
                  </div>
                </div>

                {/* 底部翻转提示 */}
                <div className="border-t border-stone-300/80 pt-2 text-center text-[11px] font-bold text-stone-400">
                  点击任意位置翻回正面
                </div>
              </div>
            </motion.div>
          </div>

          {/* 底部按钮栏 */}
          <div className="mt-5 flex items-center gap-3">
            <Button
              className="gap-2 rounded-2xl bg-white text-stone-800 hover:bg-stone-100 shadow-md font-bold text-xs"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4 text-stone-600" />}
              {copied ? '已复制手账' : '复制明信片分享'}
            </Button>
            <Button
              className="rounded-2xl bg-emerald-700 text-white hover:bg-emerald-800 shadow-md font-bold text-xs"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-1" />
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
