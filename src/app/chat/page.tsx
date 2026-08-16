'use client'

import { Send, Trash2 } from 'lucide-react'
import { type FormEvent, useState } from 'react'

import { useTravelChat } from '@/hooks/useTravelChat'

export default function ChatPage() {
  const [input, setInput] = useState('')
  const { error, messages, sendMessage, setMessages, status, stop } = useTravelChat()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready') return
    sendMessage({ text })
    setInput('')
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-background text-travel-ink">
      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden bg-[url('data:image/svg+xml,...')] bg-repeat pb-[34px] pl-5 pr-5 pt-[18px]">
        {/* 装饰圆圈 */}
        <div className="pointer-events-none absolute right-[12%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border border-stone-900/6 bg-transparent" />

        <div className="relative z-[1] mx-auto flex w-full max-w-[900px] items-start justify-between gap-4">
          <div>
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-travel-muted">
              AI 旅行助手
            </p>
            <h1 className="font-serif text-[clamp(24px,5vw,32px)] font-extrabold leading-[1.16] tracking-tight text-travel-ink">
              AI 旅行规划师
            </h1>
            <p className="mt-1.5 text-[13px] leading-relaxed text-travel-muted">
              告诉我目的地、天数、预算和偏好，我会帮你规划路线。
            </p>
          </div>
          <button
            aria-label="清空对话"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border border-stone-900/8 bg-travel-surface text-travel-ink transition-all hover:-translate-y-px hover:bg-white hover:text-travel-orange-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900/28"
            onClick={() => {
              if (window.confirm('确定要清空对话记录吗？')) {
                setMessages([])
              }
            }}
            title="清空对话"
            type="button"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="relative z-[2] mx-auto -mt-5 flex w-full max-w-[900px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-[28px] border border-stone-900/8 bg-travel-surface p-4 pb-[22px] shadow-[0_18px_54px_rgba(41,37,36,0.12)] scrollbar-thin scrollbar-thumb-stone-900/20">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[680px] py-[clamp(12px,3vh,28px)]">
            {/* 空状态卡片 */}
            <div className="relative mb-[18px] overflow-hidden rounded-3xl border border-stone-900/6 bg-travel-surface p-7 text-center shadow-[var(--shadow-paper)]">
              <div className="absolute -bottom-[54px] -right-7 h-[164px] w-[164px] rounded-full bg-amber-200/62" />
              <div className="relative z-[1] mx-auto mb-[18px] flex h-[66px] w-[66px] items-center justify-center rounded-[22px] border border-stone-900/6 bg-primary/8 text-3xl text-travel-ink animate-[pulseGlow_2.5s_infinite]">
                ✈️
              </div>
              <h2 className="relative z-[1] mb-2 font-serif text-[22px] font-extrabold tracking-tight text-travel-ink">
                开始规划你的旅行
              </h2>
              <p className="relative z-[1] mb-1.5 text-[13px] leading-relaxed text-slate-600/82">
                告诉我你想去哪里，我会为你制定详细的行程计划
              </p>
              <p className="relative z-[1] text-xs text-stone-900/50">
                试试下方的快捷问题
              </p>
            </div>

            {/* 快捷问题 */}
            <p className="mb-3 ml-0.5 font-serif text-[13px] font-extrabold tracking-[0.1em] text-travel-ink">
              快捷问题
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                '帮我规划杭州3天2晚行程',
                '推荐上海周末游路线',
                '北京5天深度游攻略',
                '成都美食之旅怎么安排',
              ].map((question, index) => (
                <button
                  className="inline-flex min-w-[min(260px,100%)] flex-1 basis-[calc(50%-10px)] items-center gap-2.5 rounded-full border border-stone-900/6 bg-travel-surface p-3.5 text-left shadow-[0_12px_30px_rgba(41,37,36,0.08)] transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/10 hover:shadow-[0_16px_36px_rgba(41,37,36,0.11),inset_0_1px_0_rgba(255,255,255,0.78)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900/22 animate-[fadeUp_0.4s_cubic-bezier(0.16,1,0.3,1)_both]"
                  key={index}
                  onClick={() => sendMessage({ text: question })}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  type="button"
                >
                  <span className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-extrabold tabular-nums text-white shadow-[0_8px_18px_rgba(var(--travel-primary-rgb),0.3)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-[13px] font-bold leading-[1.45] text-travel-ink">
                    {question}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            className={message.role === 'user' ? 'mx-2 mb-3 text-right' : 'mx-2 mb-3 flex items-start gap-2.5'}
            key={message.id}
          >
            {message.role === 'assistant' && (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-stone-900/6 bg-primary/8 text-[15px] text-travel-ink">
                🤖
              </div>
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
                    <p className={message.role === 'user' ? 'm-0 text-sm leading-relaxed' : ''} key={index}>
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
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-stone-900/6 bg-primary/8 text-[15px] text-travel-ink">
              🤖
            </div>
            <div className="flex gap-1.5 rounded-[6px_18px_18px] border border-stone-900/6 bg-travel-surface p-3 px-4 shadow-[0_10px_28px_rgba(41,37,36,0.08)]">
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite] rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.15s] rounded-full bg-primary" />
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.3s] rounded-full bg-primary" />
            </div>
          </div>
        )}

        {error && (
          <div className="mx-2 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-100/80 p-3 px-3.5 text-[13px] font-extrabold text-destructive" role="alert">
            <span>{error.message}</span>
            <button
              className="min-h-9 rounded-full border border-red-500/22 bg-white/72 px-3.5 font-black text-destructive"
              onClick={() => sendMessage({ text: '请重试' })}
              type="button"
            >
              重试
            </button>
          </div>
        )}
      </div>

      {/* 输入栏 */}
      <div className="flex-shrink-0 border-t border-stone-900/6 bg-travel-surface p-3 pb-[max(18px,env(safe-area-inset-bottom))] shadow-[0_-18px_42px_rgba(41,37,36,0.08)]">
        <form
          className="mx-auto flex w-full max-w-[900px] items-center gap-2.5 rounded-[20px] border border-stone-900/8 bg-white p-2"
          onSubmit={handleSubmit}
        >
          <input
            aria-label="输入消息"
            className="h-11 flex-1 rounded-[14px] border border-stone-900/8 bg-white/72 px-4 text-sm text-travel-ink shadow-[inset_0_1px_4px_rgba(41,37,36,0.06)] outline-none placeholder:text-stone-900/44 focus:border-primary/44 focus:shadow-[0_0_0_3px_rgba(var(--travel-primary-rgb),0.14),inset_0_1px_4px_rgba(var(--travel-ocean-rgb),0.06)] disabled:cursor-not-allowed disabled:text-stone-900/46 disabled:bg-white/42"
            disabled={status !== 'ready'}
            onChange={(event) => setInput(event.target.value)}
            placeholder="例如：帮我规划杭州 3 天 2 晚，预算 3000 元"
            value={input}
          />
          <button
            aria-label="发送"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[14px] border-0 bg-primary text-white shadow-[0_12px_24px_rgba(var(--travel-primary-rgb),0.34)] transition-all hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(var(--travel-primary-rgb),0.42)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900/24 disabled:cursor-not-allowed disabled:text-stone-900/42 disabled:bg-stone-900/10 disabled:shadow-none"
            disabled={!input.trim() || status !== 'ready'}
            title="发送"
            type="submit"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </section>
  )
}
