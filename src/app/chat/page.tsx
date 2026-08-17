'use client'

import type { FormEvent } from 'react'
import { Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'

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
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-white text-travel-ink">
      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-[40px] pl-5 pr-5 pt-[24px]">
        {/* 装饰元素 */}
        <div className="absolute -right-16 -top-16 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-[180px] w-[180px] rounded-full bg-gradient-to-br from-purple-200/20 to-pink-200/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[12%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-2 border-blue-200/40 bg-transparent" />

        <div className="relative z-[1] mx-auto flex w-full max-w-[900px] items-start justify-between gap-4">
          <div className="animate-fade-in-up">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blue-500">
              AI 旅行助手
            </p>
            <h1 className="font-serif text-[clamp(24px,5vw,32px)] font-extrabold leading-[1.16] tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                AI 旅行规划师
              </span>
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-gray-500">
              告诉我目的地、天数、预算和偏好，我会帮你规划路线。
            </p>
          </div>
          <Button
            aria-label="清空对话"
            className="flex-shrink-0 border-white/60 bg-white/80 text-gray-500 shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white hover:text-red-500 hover:shadow-md"
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

      {/* 消息列表 */}
      <div className="relative z-[2] mx-auto -mt-6 flex w-full max-w-[900px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-[28px] border border-white/60 bg-white/90 p-4 pb-[22px] shadow-[0_18px_54px_rgba(0,0,0,0.08)] backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-200">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[680px] py-[clamp(12px,3vh,28px)]">
            {/* 空状态卡片 */}
            <div className="relative mb-[18px] overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-lg backdrop-blur-sm animate-fade-in-up">
              <div className="absolute -bottom-[54px] -right-7 h-[164px] w-[164px] rounded-full bg-gradient-to-br from-blue-100 to-indigo-100" />
              <div className="absolute -top-[30px] -left-[30px] h-[120px] w-[120px] rounded-full bg-gradient-to-br from-orange-100 to-red-100" />
              <div className="relative z-[1] mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl text-white shadow-lg shadow-blue-500/25 animate-[pulseGlow_2.5s_infinite]">
                ✈️
              </div>
              <h2 className="relative z-[1] mb-3 font-serif text-[22px] font-extrabold tracking-tight text-gray-900">
                开始规划你的旅行
              </h2>
              <p className="relative z-[1] mb-2 text-[13px] leading-relaxed text-gray-500">
                告诉我你想去哪里，我会为你制定详细的行程计划
              </p>
              <p className="relative z-[1] text-xs text-gray-400">试试下方的快捷问题</p>
            </div>

            {/* 快捷问题 */}
            <p className="mb-4 ml-0.5 font-serif text-[13px] font-bold tracking-[0.1em] text-gray-900">
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
                  className="inline-flex min-w-[min(260px,100%)] flex-1 basis-[calc(50%-12px)] items-center gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50/50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-200 animate-fade-in-up"
                  key={index}
                  onClick={() => sendMessage({ text: question })}
                  style={{ animationDelay: `${index * 80}ms` }}
                  type="button"
                >
                  <span className="flex h-[28px] w-[28px] flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-[11px] font-bold tabular-nums text-white shadow-sm">
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-[13px] font-semibold leading-[1.45] text-gray-700">
                    {question}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(message => (
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
                <AvatarFallback className="rounded-xl border border-stone-900/6 bg-primary/8 text-[15px]">
                  🤖
                </AvatarFallback>
              </Avatar>
            )}
            <div
              className={
                message.role === 'user'
                  ? 'inline-block max-w-[70%] rounded-[18px_18px_4px_18px] bg-primary p-3 px-4 text-white shadow-[0_8px_20px_rgba(var(--travel-primary-rgb),0.3)]'
                  : ''
              }
            >
              {message.parts.map((part, index) => {
                if (part.type === 'text') {
                  return (
                    <p
                      className={message.role === 'user' ? 'm-0 text-sm leading-relaxed' : ''}
                      key={index}
                    >
                      {part.text}
                    </p>
                  )
                }
                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  return (
                    <pre className="overflow-auto rounded-2xl bg-muted p-3 text-xs" key={index}>
                      {JSON.stringify(part, null, 2)}
                    </pre>
                  )
                }
                return null
              })}
            </div>
          </div>
        ))}

        {status === 'submitted' && (
          <div className="mx-2 mb-3 flex items-start gap-2.5">
            <Avatar className="h-8 w-8 flex-shrink-0 rounded-xl">
              <AvatarFallback className="rounded-xl border border-stone-900/6 bg-primary/8 text-[15px]">
                🤖
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
            className="mx-2 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-100/80 p-3 px-3.5 text-[13px] font-extrabold text-destructive"
            role="alert"
          >
            <span>{error.message}</span>
            <Button
              className="border-red-500/22 bg-white/72 font-black text-destructive"
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
          className="mx-auto flex w-full max-w-[900px] items-center gap-2.5 rounded-[20px] border border-stone-900/8 bg-white p-2"
          onSubmit={handleSubmit}
        >
          <Input
            aria-label="输入消息"
            className="h-11 flex-1 rounded-[14px] border-stone-900/8 bg-white/72 shadow-[inset_0_1px_4px_rgba(41,37,36,0.06)] placeholder:text-stone-900/44 focus:border-primary/44 focus:shadow-[0_0_0_3px_rgba(var(--travel-primary-rgb),0.14),inset_0_1px_4px_rgba(var(--travel-ocean-rgb),0.06)] disabled:text-stone-900/46 disabled:bg-white/42"
            disabled={status !== 'ready'}
            onChange={event => setInput(event.target.value)}
            placeholder="例如：帮我规划杭州 3 天 2 晚，预算 3000 元"
            value={input}
          />
          <Button
            aria-label="发送"
            className="h-11 w-11 flex-shrink-0 rounded-[14px] shadow-[0_12px_24px_rgba(var(--travel-primary-rgb),0.34)] hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(var(--travel-primary-rgb),0.42)] disabled:text-stone-900/42 disabled:bg-stone-900/10 disabled:shadow-none"
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
