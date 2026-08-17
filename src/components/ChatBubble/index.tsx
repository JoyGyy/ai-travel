'use client'

/**
 * 聊天气泡组件
 * 根据消息角色（用户 / AI 助手）显示不同样式的气泡
 * 用户消息纯文本渲染，AI 消息通过 react-markdown 渲染 Markdown
 * react-markdown 使用动态导入（lazy）以减少初始包大小
 */
import { Bot } from 'lucide-react'
import { lazy, Suspense } from 'react'

/* ========== 懒加载 Markdown 渲染器 ========== */

const Markdown = lazy(() => import('react-markdown'))

/* ========== 类型定义 ========== */

interface ChatBubbleProps {
  content: string
  role: 'assistant' | 'user'
}

/* ========== 聊天气泡组件 ========== */

export function ChatBubble({ content, role }: ChatBubbleProps) {
  const isUser = role === 'user'

  return (
    <div
      className={`flex items-start gap-2.5 mx-2 mb-3.5 animate-[fadeUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both] motion-reduce:animate-none max-sm:mx-1 ${isUser ? 'justify-end' : ''}`}
    >
      {/* AI 消息显示机器人头像 */}
      {!isUser && (
        <div
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-travel-ink/6 bg-primary/8 text-[15px] text-travel-ocean"
        >
          <Bot size={20} />
        </div>
      )}
      <div
        className={`min-w-0 max-w-[min(78%,640px)] overflow-wrap-anywhere break-words text-sm leading-[1.7] whitespace-pre-wrap max-sm:max-w-[84%] ${
          isUser
            ? 'rounded-[20px_20px_6px] bg-primary px-4 py-[11px] text-white shadow-[0_14px_28px_rgba(20,184,166,0.32)]'
            : 'rounded-[6px_20px_20px] border border-travel-ink/6 bg-travel-surface px-4 py-3 text-travel-ocean shadow-[0_12px_30px_rgba(41,37,36,0.08)]'
        }`}
      >
        {/* 用户消息纯文本，AI 消息走 Markdown 渲染 */}
        {isUser
          ? (
              content
            )
          : (
              <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-bold [&_a]:text-travel-ocean [&_code]:rounded-md [&_code]:bg-[rgba(249,224,189,0.72)] [&_code]:text-[#7a4a1e]">
                <Suspense fallback={<span className="text-travel-muted">加载中...</span>}>
                  <Markdown>{content}</Markdown>
                </Suspense>
              </div>
            )}
      </div>
    </div>
  )
}
