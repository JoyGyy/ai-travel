/**
 * 聊天气泡组件
 * 根据消息角色（用户/AI）显示不同样式的气泡
 */
import { RobotOutlined } from '@ant-design/icons'
import Markdown from 'react-markdown'
import './style.css'

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
                <Markdown>{content}</Markdown>
              </div>
            )}
      </div>
    </div>
  )
}
