import { RobotOutlined } from '@ant-design/icons'
/**
 * 聊天气泡组件
 * 根据消息角色（用户/AI）显示不同样式的气泡
 * react-markdown 使用动态导入以减少初始包大小
 */
import { Suspense, lazy } from 'react'

import './style.css'

const Markdown = lazy(() => import('react-markdown'))

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
      {!isUser && (
        <div className="chat-bubble__avatar" aria-hidden="true">
          <RobotOutlined />
        </div>
      )}
      <div className={`chat-bubble__content ${isUser ? 'chat-bubble__content--user' : 'chat-bubble__content--ai'}`}>
        {isUser
          ? content
          : (
              <div className="markdown-body">
                <Suspense fallback={<span className="chat-bubble__loading">加载中...</span>}>
                  <Markdown>{content}</Markdown>
                </Suspense>
              </div>
            )}
      </div>
    </div>
  )
}
