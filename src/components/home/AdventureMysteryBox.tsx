'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Compass, Dices, RefreshCw, Sparkles } from 'lucide-react'
import { useState } from 'react'

export interface MysteryDestination {
  budget: number
  city: string
  days: number
  desc: string
  emoji: string
  highlight: string
  tag: string
}

const MYSTERY_POOL: MysteryDestination[] = [
  {
    budget: 3800,
    city: '大理',
    days: 4,
    desc: '环洱海自驾，苍山云海下的慢调咖啡时光',
    emoji: '🌊',
    highlight: '海东落日 · 古镇民谣',
    tag: '慢节奏治愈',
  },
  {
    budget: 5200,
    city: '阿勒泰',
    days: 6,
    desc: '神仙湾晨雾与禾木白桦林的秋日童话',
    emoji: '🌲',
    highlight: '图瓦木屋 · 喀纳斯湖',
    tag: '荒野摄影',
  },
  {
    budget: 2800,
    city: '杭州',
    days: 3,
    desc: '漫步龙井茶园与西湖雨后烟柳，寻觅江南禅意',
    emoji: '🍃',
    highlight: '九溪十八涧 · 灵隐素斋',
    tag: '江南慢游',
  },
  {
    budget: 3500,
    city: '成都',
    days: 4,
    desc: '老茶馆打铜壶、地道市井火锅与大熊猫基地',
    emoji: '🐼',
    highlight: '人民公园慢茶 · 锦江夜游',
    tag: '老饕美食',
  },
  {
    budget: 4600,
    city: '桂林',
    days: 5,
    desc: '阳朔遇龙河竹筏漂流，骑行于喀斯特山水画卷',
    emoji: '🛶',
    highlight: '兴坪相公山 · 西街夜市',
    tag: '山水漫游',
  },
  {
    budget: 3200,
    city: '西安',
    days: 4,
    desc: '盛唐夜唱大唐不夜城，城墙骑行与回坊碳水狂欢',
    emoji: '🏮',
    highlight: '兵马俑震撼 · 陕历博探秘',
    tag: '人文古韵',
  },
  {
    budget: 4200,
    city: '厦门',
    days: 4,
    desc: '环岛路骑行海风微拂，鼓浪屿老别墅时光漫步',
    emoji: '🚲',
    highlight: '沙坡尾文艺 · 黄厝看日出',
    tag: '浪漫海滨',
  },
  {
    budget: 5800,
    city: '敦煌',
    days: 5,
    desc: '鸣沙山月牙泉驼铃叮咚，莫高窟千佛壁画千年一瞥',
    emoji: '🐫',
    highlight: '大漠落日 · 飞天壁画',
    tag: '丝路探索',
  },
]

interface AdventureMysteryBoxProps {
  onApply: (destination: MysteryDestination) => void
}

export function AdventureMysteryBox({ onApply }: AdventureMysteryBoxProps) {
  const [current, setCurrent] = useState<MysteryDestination>(MYSTERY_POOL[0])
  const [isRolling, setIsRolling] = useState(false)
  const [hasRolled, setHasRolled] = useState(false)

  const handleRoll = () => {
    if (isRolling)
      return
    setIsRolling(true)
    setHasRolled(true)

    let rolls = 0
    const maxRolls = 12
    const interval = setInterval(() => {
      const randomItem = MYSTERY_POOL[Math.floor(Math.random() * MYSTERY_POOL.length)]
      setCurrent(randomItem)
      rolls++
      if (rolls >= maxRolls) {
        clearInterval(interval)
        setIsRolling(false)
      }
    }, 90)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-300/80 bg-gradient-to-br from-[#FFFDF9] via-[#FAF7F0] to-amber-50/60 p-5 sm:p-6 shadow-sm transition-all hover:shadow-md">
      {/* 顶部标签 */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-stone-950 font-black shadow-sm text-xs">
            🎲
          </span>
          <span className="font-serif text-sm font-bold text-stone-900">
            目的地灵感盲盒 · Roll for Adventure
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-300/70">
          随机摇号
        </span>
      </div>

      {/* 盲盒展示卡片 */}
      <div className="relative rounded-2xl border border-stone-200/90 bg-white p-4 shadow-inner overflow-hidden min-h-[100px] flex items-center justify-between gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex-1 min-w-0"
            exit={{ opacity: 0, scale: 0.95, y: isRolling ? -15 : 15 }}
            initial={{ opacity: 0, scale: 0.95, y: isRolling ? 15 : -15 }}
            key={current.city + (isRolling ? Math.random() : '')}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{current.emoji}</span>
              <span className="font-serif text-xl sm:text-2xl font-black text-stone-900">
                {current.city}
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {current.tag}
              </span>
            </div>
            <p className="text-xs text-stone-600 line-clamp-1 leading-relaxed">
              {current.desc}
            </p>
            <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-stone-500">
              <span>
                📅
                {current.days}
                天行程
              </span>
              <span>
                💰 预算约 ¥
                {current.budget}
              </span>
              <span className="text-amber-700">
                ✨
                {current.highlight}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* 骰子交互按钮 */}
        <button
          className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-600 text-stone-950 shadow-md shadow-amber-500/25 transition-all active:scale-95 cursor-pointer ${
            isRolling ? 'animate-spin' : 'hover:rotate-12'
          }`}
          disabled={isRolling}
          onClick={handleRoll}
          title="换一个灵感盲盒"
          type="button"
        >
          {isRolling ? (
            <RefreshCw className="h-6 w-6 animate-spin text-stone-950" />
          ) : (
            <Dices className="h-7 w-7 text-stone-950" />
          )}
        </button>
      </div>

      {/* 底部操作与一键填充 */}
      <div className="mt-4 flex items-center justify-between gap-3 pt-2">
        <p className="text-xs text-stone-500 flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          {hasRolled ? '已摇出心动灵感！可直接一键编排' : '纠结去哪？点击骰子摇出专属灵感'}
        </p>
        <button
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-800/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          onClick={() => onApply(current)}
          type="button"
        >
          <Compass className="h-3.5 w-3.5" />
          一键装填并规划
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
