import { LocationOutline } from 'antd-mobile-icons'

interface RAGSourceProps {
  sources: string[]
}

export function RAGSource({ sources }: RAGSourceProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div
      className="mx-4 mb-3 px-4 py-3 rounded-xl transition-all duration-200"
      style={{ background: 'rgba(27, 67, 50, 0.06)', border: '1px solid rgba(27, 67, 50, 0.12)' }}
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
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors duration-200"
            style={{ background: 'rgba(27, 67, 50, 0.1)', color: 'var(--c-forest)' }}
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  )
}
