'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, Compass } from 'lucide-react'
import { useState } from 'react'

interface StampAnimationProps {
  city?: string
  date?: string
}

export function StampAnimation({ city = '目的地', date }: StampAnimationProps) {
  const [, setClicked] = useState(false)
  const displayDate = date || new Date().toISOString().split('T')[0]

  return (
    <motion.div
      animate={{
        opacity: 1,
        rotate: -10,
        scale: [2.5, 0.9, 1.05, 1],
        y: [-40, 5, -2, 0],
      }}
      className="inline-block cursor-pointer select-none"
      initial={{ opacity: 0, rotate: -25, scale: 2.5, y: -40 }}
      onClick={() => setClicked(true)}
      title="点击查看手账认证"
      transition={{
        damping: 12,
        duration: 0.7,
        mass: 0.8,
        stiffness: 260,
        type: 'spring',
      }}
      whileHover={{ rotate: -6, scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
    >
      <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-red-600/80 bg-red-500/10 px-4 py-2 text-red-700 backdrop-blur-xs shadow-sm">
        {/* 顶部五角星与印章标记 */}
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-700">
          <span>★</span>
          <span>AI ROADBOOK VERIFIED</span>
          <span>★</span>
        </div>

        {/* 城市与官方认证 */}
        <div className="my-0.5 flex items-center gap-1.5">
          <Compass className="h-3.5 w-3.5 text-red-700" />
          <span className="font-serif text-sm font-black tracking-wider text-red-800">
            {city}
            {' '}
            · 官方漫游手账
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 text-red-700" />
        </div>

        {/* 底部日期与打孔码 */}
        <div className="flex items-center gap-2 border-t border-dashed border-red-600/60 pt-0.5 text-[9px] font-mono font-bold tracking-wider text-red-600">
          <span>
            ISSUED:
            {displayDate}
          </span>
          <span>
            NO.
            {Math.abs(city.split('').reduce((acc, char) => acc + char.charCodeAt(0), 1024))}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
