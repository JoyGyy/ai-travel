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
    <div className="mx-2 mb-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 shadow-sm animate-[fadeUp_0.3s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none max-sm:mx-1">
      {/* ---- 标题栏 ---- */}
      <div className="mb-2 flex items-center gap-1.5 font-bold tracking-wider text-emerald-900 text-xs">
        <MapPin
          className="shrink-0 text-emerald-700"
          size={14}
        />
        <span>知识库检索与参考来源</span>
      </div>
      {/* ---- 来源标签列表 ---- */}
      <div className="flex flex-wrap gap-1.5">
        {sources.map(source => (
          <span
            className="max-w-full overflow-wrap-anywhere rounded-full border border-stone-200 bg-white px-3 py-1 font-medium text-stone-800 text-xs shadow-2xs"
            key={source}
          >
            🌿
            {' '}
            {source}
          </span>
        ))}
      </div>
    </div>
  )
}
