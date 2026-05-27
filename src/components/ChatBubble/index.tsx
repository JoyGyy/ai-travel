/**
 * 聊天气泡组件
 * 根据消息角色（用户/AI）显示不同样式的气泡
 */
import { ChatAddOutline } from 'antd-mobile-icons'

/** 组件属性接口 */
interface ChatBubbleProps {
  role: 'user' | 'assistant' // 消息角色：用户或 AI 助手
  content: string            // 消息内容
}

/**
 * 聊天气泡组件
 * 用户消息右对齐，AI 消息左对齐并显示头像
 */
export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user' // 判断是否为用户消息

  return (
    <div
      className="flex items-start gap-2 mb-3.5"
      style={{
        justifyContent: isUser ? 'flex-end' : 'flex-start', // 用户消息右对齐，AI 消息左对齐
        animation: 'fadeUp 0.3s ease both', // 淡入上移动画
      }}
    >
      {/* AI 头像 - 仅在 AI 消息时显示 */}
      {!isUser && (
        <div
          className="shrink-0 flex items-center justify-center"
          style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--c-sand)' }}
        >
          <ChatAddOutline style={{ fontSize: '14px', color: 'var(--c-terracotta)' }} />
        </div>
      )}
      {/* 消息气泡 */}
      <div
        className="max-w-[75%] px-4 py-3 text-sm leading-relaxed"
        style={{
          // 用户消息右下角圆角小，AI 消息左下角圆角小，形成对话气泡效果
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          background: isUser ? 'var(--c-terracotta)' : 'var(--c-white)', // 用户消息使用主题色背景
          color: isUser ? '#fff' : 'var(--c-ink)',
          whiteSpace: 'pre-wrap', // 保留换行符
          wordBreak: 'break-word', // 长文本自动换行
          ...(isUser ? {} : { boxShadow: '0 1px 4px rgba(45, 42, 38, 0.05)' }), // AI 消息添加阴影
        }}
      >
        {content}
      </div>
    </div>
  )
}
