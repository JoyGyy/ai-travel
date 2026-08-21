/**
 * RAG 来源展示组件
 *
 * 以标签形式展示 AI 回答所参考的知识库来源，
 * 用于提升回答的可追溯性和可信度。
 */
import { MapPin } from 'lucide-react'

interface RAGSourceProps {
  sources: string[]
}

export function RAGSource({ sources }: RAGSourceProps) {
  // 无来源时不渲染
  if (!sources || sources.length === 0)
    return null

  return (
    <div className="mx-2 mb-3.5 rounded-[18px] border border-travel-ink/6 bg-primary/4 p-[13px_16px] shadow-sm animate-[fadeUp_0.3s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none max-sm:mx-1">
      {/* ---- 标题栏 ---- */}
      <div className="mb-[9px] flex items-center gap-[7px] font-extrabold tracking-[0.12em] text-travel-ocean text-[11px]">
        <MapPin
          className="shrink-0 text-primary text-[13px]"
          size={16}
        />
        <span>参考来源</span>
      </div>
      {/* ---- 来源标签列表 ---- */}
      <div className="flex flex-wrap gap-[7px]">
        {sources.map(source => (
          <span
            className="max-w-full overflow-wrap-anywhere rounded-full border border-travel-ink/6 bg-white px-2.5 py-[5px] font-bold leading-[1.35] text-travel-ocean text-[11px]"
            key={source}
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  )
}
