/**
 * RAG 引用来源展示组件
 * 在 AI 对话中展示 RAG 知识库检索到的参考景点
 */
import { LocationOutline } from 'antd-mobile-icons'

interface RAGSourceProps {
  sources: string[] // 引用来源名称列表
}

export function RAGSource({ sources }: RAGSourceProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div
      className="mx-4 mb-3 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(45, 106, 79, 0.06)', border: '1px solid rgba(45, 106, 79, 0.12)' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <LocationOutline style={{ fontSize: '14px', color: 'var(--c-forest)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--c-forest)' }}>
          参考来源
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded-full text-xs"
            style={{ background: 'rgba(45, 106, 79, 0.1)', color: 'var(--c-forest)' }}
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  )
}
