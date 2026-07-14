/**
 * RAG 来源展示组件
 */
import { EnvironmentOutlined } from '@ant-design/icons'
import './style.css'

export function RAGSource({ sources }) {
  if (!sources || sources.length === 0)
    return null

  return (
    <div className="rag-source">
      <div className="rag-source__header">
        <EnvironmentOutlined className="rag-source__icon" aria-hidden="true" />
        <span>参考来源</span>
      </div>
      <div className="rag-source__list">
        {sources.map((source, i) => (
          <span key={i} className="rag-source__tag">{source}</span>
        ))}
      </div>
    </div>
  )
}
