'use client'

import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface ThinkingAccordionProps {
  content?: string
  durationMs?: number
  isGenerating?: boolean
}

export function ThinkingAccordion({
  content,
  durationMs = 2400,
  isGenerating = false,
}: ThinkingAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const defaultContent = `1. 分析出行画像：梳理核心出游诉求与偏好，评估单日适宜游玩强度与节奏；
2. 路线拓扑规划：基于景点地理聚类与交通可达性，优选环线避免往返折返；
3. 时序平衡推演：上午安排开阔自然人文打卡，午后安排室内/阴凉场馆，傍晚漫步特色街区；
4. 动线通勤验算：校验节点间步行与行车接驳耗时，规避交通拥堵时段。`

  const displayContent = content || defaultContent
  const durationText = (durationMs / 1000).toFixed(1)

  return (
    <div className="my-2.5 overflow-hidden rounded-2xl border border-emerald-200/80 bg-emerald-50/50 text-xs transition-all shadow-2xs">
      <button
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-emerald-950 hover:bg-emerald-100/50 transition-colors cursor-pointer"
        onClick={() => setIsOpen(prev => !prev)}
        type="button"
      >
        <div className="flex items-center gap-2 font-bold">
          <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-700 text-white">
            <Brain className="h-3 w-3" />
          </div>
          <span className="flex items-center gap-1.5 text-xs text-emerald-900">
            {isGenerating ? (
              <>
                <Sparkles className="h-3.5 w-3.5 animate-spin text-emerald-700" />
                <span>AI 正在深度思考规划逻辑...</span>
              </>
            ) : (
              <>
                <span>深度思考已完成</span>
                <span className="text-[10px] text-emerald-700/80 font-normal">
                  (耗时约
                  {' '}
                  {durationText}
                  s)
                </span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-800">
          <span>{isOpen ? '收起思考' : '展开推导'}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-emerald-200/60 bg-white/80 px-4 py-3 text-stone-700 leading-relaxed font-sans text-xs space-y-1.5">
          <div className="whitespace-pre-line text-stone-600">
            {displayContent}
          </div>
        </div>
      )}
    </div>
  )
}
