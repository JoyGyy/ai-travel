/**
 * 聊天气泡组件
 * 根据消息角色（用户/AI）显示不同样式的气泡
 */
import { ChatAddOutline } from 'antd-mobile-icons'

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className="flex items-start gap-2.5 mb-3"
      style={{
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        animation: 'fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* AI 头像 */}
      {!isUser && (
        <div
          className="shrink-0 flex items-center justify-center"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--c-sand) 0%, var(--c-cream) 100%)',
            boxShadow: '0 1px 3px rgba(194, 114, 75, 0.1)',
          }}
        >
          <ChatAddOutline style={{ fontSize: '14px', color: 'var(--c-terracotta)' }} />
        </div>
      )}

      {/* 消息气泡 */}
      <div
        className={`max-w-[78%] text-sm ${isUser ? 'px-4 py-2.5' : 'px-4 py-3'}`}
        style={{
          borderRadius: isUser ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
          background: isUser
            ? 'linear-gradient(135deg, var(--c-terracotta) 0%, var(--c-terracotta-light) 100%)'
            : 'var(--c-white)',
          color: isUser ? '#fff' : 'var(--c-ink)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: '1.7',
          ...(isUser
            ? { boxShadow: '0 2px 8px rgba(194, 114, 75, 0.15)' }
            : { boxShadow: '0 1px 4px rgba(45, 42, 38, 0.04), 0 0 0 1px rgba(240, 232, 221, 0.5)' }),
        }}
      >
        {isUser
          ? content
          : <div className="markdown-body">{content}</div>}
      </div>
    </div>
  )
}
