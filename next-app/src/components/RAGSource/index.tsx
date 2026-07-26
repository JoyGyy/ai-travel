/**
 * RAG 来源展示组件
 *
 * 以标签形式展示 AI 回答所参考的知识库来源，
 * 用于提升回答的可追溯性和可信度。
 */
import { EnvironmentOutlined } from '@ant-design/icons'

import './style.css'

interface RAGSourceProps {
  sources: string[]
}

export function RAGSource({ sources }: RAGSourceProps) {
  // 无来源时不渲染
  if (!sources || sources.length === 0)
    return null

  return (
    <div className="rag-source">
      {/* ---- 标题栏 ---- */}
      <div className="rag-source__header">
        <EnvironmentOutlined className="rag-source__icon" aria-hidden="true" />
        <span>参考来源</span>
      </div>
      {/* ---- 来源标签列表 ---- */}
      <div className="rag-source__list">
        {sources.map(source => (
          <span key={source} className="rag-source__tag">{source}</span>
        ))}
      </div>
    </div>
  )
}
