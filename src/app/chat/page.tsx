'use client'

import type { FormEvent } from 'react'

import { Bot, Plane, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { RAGSource } from '@/components/RAGSource'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'
import { extractRagSources } from '@/lib/ai/sources'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const { error, messages, sendMessage, setMessages, status } = useTravelChat()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready')
      return
    sendMessage({ text })
    setInput('')
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-travel-surface-muted text-travel-ink">
      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden border-b border-travel-ink/8 bg-travel-surface-muted pb-10 pl-5 pr-5 pt-6">

        <div className="relative z-1 mx-auto flex w-full max-w-[900px] items-start justify-between gap-4">
          <div className="animate-fade-in-up">
            <p className="mb-2 text-2.75 font-bold uppercase tracking-[0.16em] text-primary">
              AI 旅行助手
            </p>
            <h1 className="font-serif text-[clamp(24px,5vw,32px)] font-extrabold leading-[1.16] tracking-tight">
              AI 旅行规划师
            </h1>
            <p className="mt-2 text-3.25 leading-relaxed text-gray-500">
              告诉我目的地、天数、预算和偏好，我会帮你规划路线。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex-shrink-0 border-travel-ink/10 bg-white text-travel-muted shadow-sm hover:-translate-y-0.5 hover:bg-white hover:text-destructive hover:shadow-md"
              onClick={() => {
                if (window.confirm('确定要清空对话记录吗？')) {
                  setMessages([])
                }
              }}
              size="icon"
              title="清空对话"
              variant="outline"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="relative z-2 mx-auto -mt-6 flex w-full max-w-[900px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-2xl border border-travel-ink/10 bg-white p-4 pb-5.5 shadow-[0_18px_54px_rgba(25,52,60,0.08)] scrollbar-thin scrollbar-thumb-gray-200">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[680px] py-[clamp(12px,3vh,28px)]">
            {/* 空状态卡片 */}
            <div className="relative mb-4.5 overflow-hidden rounded-xl border border-travel-ink/10 bg-white p-8 text-center shadow-sm animate-fade-in-up">
              <div className="relative z-1 mx-auto mb-4.5 flex h-18 w-18 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                <Plane className="h-8 w-8" />
              </div>
              <h2 className="relative z-1 mb-3 font-serif text-5.5 font-extrabold tracking-tight text-gray-900">
                开始规划你的旅行
              </h2>
              <p className="relative z-1 mb-2 text-3.25 leading-relaxed text-gray-500">
                告诉我你想去哪里，我会为你制定详细的行程计划
              </p>
              <p className="relative z-1 text-xs text-gray-400">试试下方的快捷问题</p>
            </div>

            {/* 快捷问题 */}
            <p className="mb-4 ml-0.5 font-serif text-3.25 font-bold tracking-[0.1em] text-gray-900">
              快捷问题
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                '帮我规划杭州3天2晚行程',
                '推荐上海周末游路线',
                '北京5天深度游攻略',
                '成都美食之旅怎么安排',
              ].map((question, index) => (
                <button
                  className="inline-flex min-w-[min(260px,100%)] flex-1 basis-[calc(50%-12px)] items-center gap-3 rounded-lg border border-travel-ink/10 bg-white p-4 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary/40 animate-fade-in-up"
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  onClick={() => sendMessage({ text: question })}
                  style={{ animationDelay: `${index * 80}ms` }}
                  type="button"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-2.75 font-bold tabular-nums text-white shadow-sm">
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-3.25 font-semibold leading-[1.45] text-gray-700">
                    {question}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const sources = extractRagSources(
            message.parts
              .filter(part => part.type.startsWith('tool-') || part.type === 'dynamic-tool')
              .map(part => (part as { output?: unknown }).output),
          )

          return (
            <div
              className={
                message.role === 'user'
                  ? 'mx-2 mb-3 text-right'
                  : 'mx-2 mb-3 flex items-start gap-2.5'
              }
              key={message.id}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 flex-shrink-0 rounded-xl">
                  <AvatarFallback className="rounded-xl border border-stone-900/6 bg-primary/8 text-primary">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={
                  message.role === 'user'
                    ? 'inline-block max-w-[70%] rounded-[18px_18px_4px_18px] bg-primary p-3 px-4 text-white shadow-[0_8px_20px_rgba(20,184,166,0.3)]'
                    : ''
                }
              >
                {message.parts.map((part, index) => {
                  if (part.type === 'text') {
                    return (
                      <p
                        className={message.role === 'user' ? 'm-0 text-sm leading-relaxed' : ''}
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        {part.text}
                      </p>
                    )
                  }
                  // 隐藏工具调用的原始数据，只显示一个简洁的状态
                  if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                    return (
                      <div
                        className="my-1 flex items-center gap-1.5 text-xs text-gray-400"
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>正在查询...</span>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
              {message.role === 'assistant' && <RAGSource sources={sources} />}
            </div>
          )
        })}

        {status === 'submitted' && (
          <div className="mx-2 mb-3 flex items-start gap-2.5">
            <Avatar className="h-8 w-8 flex-shrink-0 rounded-xl">
              <AvatarFallback className="rounded-xl border border-stone-900/6 bg-primary/8 text-primary">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-1.5 rounded-[6px_18px_18px] border border-stone-900/6 bg-travel-surface p-3 px-4 shadow-[0_10px_28px_rgba(41,37,36,0.08)]">
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite] rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.15s] rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.3s] rounded-full bg-primary" />
            </div>
          </div>
        )}

        {error && (
          <div
            className="mx-2 mb-3 flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-100/80 p-3 px-3.5 text-3.25 font-semibold text-destructive"
          >
            <span>{error.message}</span>
            <Button
              className="border-red-500/22 bg-white/72 font-semibold text-destructive"
              onClick={() => sendMessage({ text: '请重试' })}
              size="sm"
              variant="outline"
            >
              重试
            </Button>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div className="flex-shrink-0 border-t border-stone-900/6 bg-travel-surface p-3 pb-[max(18px,env(safe-area-inset-bottom))] shadow-[0_-18px_42px_rgba(41,37,36,0.08)]">
        <form
          className="mx-auto flex w-full max-w-[900px] items-center gap-2.5 rounded-5 border border-stone-900/8 bg-white p-2"
          onSubmit={handleSubmit}
        >
          <Input
            className="h-11 flex-1 rounded-lg border-travel-ink/10 bg-white shadow-[inset_0_1px_4px_rgba(25,52,60,0.06)] placeholder:text-travel-muted focus:border-primary/44 focus:shadow-[0_0_0_3px_rgba(34,111,120,0.14),inset_0_1px_4px_rgba(25,52,60,0.06)] disabled:text-travel-muted disabled:bg-white/42"
            disabled={status !== 'ready'}
            onChange={event => setInput(event.target.value)}
            placeholder="例如：帮我规划杭州 3 天 2 晚，预算 3000 元"
            value={input}
          />
          <Button
            className="h-11 w-11 flex-shrink-0 rounded-lg shadow-[0_12px_24px_rgba(34,111,120,0.28)] hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(34,111,120,0.36)] disabled:text-travel-muted disabled:bg-travel-ink/10 disabled:shadow-none"
            disabled={!input.trim() || status !== 'ready'}
            size="icon"
            title="发送"
            type="submit"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </section>
  )
}
