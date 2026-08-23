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
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-100/80 text-emerald-800 shadow-2xs"
        >
          <Bot size={18} />
        </div>
      )}
      <div
        className={`min-w-0 max-w-[min(78%,640px)] overflow-wrap-anywhere break-words text-sm leading-[1.75] whitespace-pre-wrap max-sm:max-w-[84%] ${
          isUser
            ? 'rounded-2xl rounded-tr-xs bg-emerald-700 px-4.5 py-3 text-white shadow-md shadow-emerald-800/15'
            : 'rounded-2xl rounded-tl-xs border border-stone-200/90 bg-[#FDFBF7] px-4.5 py-3.5 text-stone-900 shadow-sm'
        }`}
      >
        {/* 用户消息纯文本，AI 消息走 Markdown 渲染 */}
        {isUser
          ? (
              content
            )
          : (
              <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_a]:font-bold [&_a]:text-emerald-800 [&_code]:rounded-md [&_code]:bg-amber-100/70 [&_code]:text-amber-900 [&_code]:px-1.5 [&_code]:py-0.5">
                <Suspense fallback={<span className="text-stone-400">正在生成手账建议...</span>}>
                  <Markdown>{content}</Markdown>
                </Suspense>
              </div>
            )}
      </div>
    </div>
  )
}
