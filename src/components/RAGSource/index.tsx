import { LocationOutline } from 'antd-mobile-icons'

interface RAGSourceProps {
  sources: string[]
}

export function RAGSource({ sources }: RAGSourceProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div
      className="mx-4 mb-3 px-4 py-3 rounded-xl"
      style={{
        background: 'rgba(99, 102, 241, 0.04)',
        border: '1px solid rgba(99, 102, 241, 0.08)',
        animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <LocationOutline style={{ fontSize: '13px', color: 'var(--c-ink)', opacity: 0.5 }} />
        <span className="text-[11px] font-semibold tracking-wide" style={{ color: 'var(--c-ink)', opacity: 0.5 }}>
          参考来源
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((source, i) => (
          <span
            key={i}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium"
            style={{ background: 'rgba(99, 102, 241, 0.06)', color: 'var(--c-ink)' }}
          >
            {source}
          </span>
        ))}
      </div>
    </div>
  )
}
