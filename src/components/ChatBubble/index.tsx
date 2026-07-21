/**
 * 聊天气泡组件
 * 根据消息角色（用户 / AI 助手）显示不同样式的气泡
 * 用户消息纯文本渲染，AI 消息通过 react-markdown 渲染 Markdown
 * react-markdown 使用动态导入（lazy）以减少初始包大小
 */
import { RobotOutlined } from '@ant-design/icons'
import { lazy, Suspense } from 'react'

import './style.css'

/* ========== 懒加载 Markdown 渲染器 ========== */

const Markdown = lazy(() => import('react-markdown'))

/* ========== 类型定义 ========== */

interface ChatBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

/* ========== 聊天气泡组件 ========== */

export function ChatBubble({ role, content }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--ai'}`}>
      {/* AI 消息显示机器人头像 */}
      {!isUser && (
        <div className="chat-bubble__avatar" aria-hidden="true">
          <RobotOutlined />
        </div>
      )}
      <div className={`chat-bubble__content ${isUser ? 'chat-bubble__content--user' : 'chat-bubble__content--ai'}`}>
        {/* 用户消息纯文本，AI 消息走 Markdown 渲染 */}
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
