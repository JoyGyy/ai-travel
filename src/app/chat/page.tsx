'use client'

import type { FormEvent } from 'react'
import type { ModelProvider } from '@/hooks/useTravelChat'

import { ChevronDown, Send, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'

const MODEL_OPTIONS: { label: string, value: ModelProvider }[] = [
  { label: '硅基流动', value: 'siliconflow' },
  { label: 'DeepSeek', value: 'deepseek' },
]

export default function ChatPage() {
  const [input, setInput] = useState('')
  const { error, messages, model, sendMessage, setMessages, setModel, status } = useTravelChat()
  const [showModelDropdown, setShowModelDropdown] = useState(false)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || status !== 'ready')
      return
    sendMessage({ text })
    setInput('')
  }

  return (
    <section
      className="flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-white text-travel-ink"
      onClick={() => showModelDropdown && setShowModelDropdown(false)}
    >
      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden bg-teal-50/60 pb-10 pl-5 pr-5 pt-6">
        {/* 装饰元素 */}
        <div className="absolute -right-16 -top-16 h-50 w-50 rounded-full bg-teal-200/15 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-45 w-45 rounded-full bg-cyan-200/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[12%] top-1/2 h-20 w-20 -translate-y-1/2 rounded-full border-2 border-teal-200/40 bg-transparent" />

        <div className="relative z-1 mx-auto flex w-full max-w-[900px] items-start justify-between gap-4">
          <div className="animate-fade-in-up">
            <p className="mb-2 text-2.75 font-bold uppercase tracking-[0.16em] text-blue-500">
              AI 旅行助手
            </p>
            <h1 className="font-serif text-[clamp(24px,5vw,32px)] font-extrabold leading-[1.16] tracking-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                AI 旅行规划师
              </span>
            </h1>
            <p className="mt-2 text-3.25 leading-relaxed text-gray-500">
              告诉我目的地、天数、预算和偏好，我会帮你规划路线。
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* 模型选择下拉框 */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <Button
                aria-expanded={showModelDropdown}
                aria-haspopup="listbox"
                className="flex-shrink-0 gap-1.5 border-white/60 bg-white/80 text-gray-600 shadow-sm backdrop-blur-sm hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                variant="outline"
              >
                <span className="text-xs font-medium">
                  {MODEL_OPTIONS.find(o => o.value === model)?.label}
                </span>
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </Button>
              {showModelDropdown && (
                <div
                  className="absolute right-0 top-full z-50 mt-1 min-w-[120px] overflow-hidden rounded-xl border border-white/60 bg-white/95 shadow-xl backdrop-blur-sm"
                  role="listbox"
                >
                  {MODEL_OPTIONS.map(option => (
                    <button
                      className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                        model === option.value
                          ? 'bg-teal-50 text-teal-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      key={option.value}
                      onClick={() => {
                        setModel(option.value)
                        setShowModelDropdown(false)
                      }}
                      role="option"
                      aria-selected={model === option.value}
                      type="button"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
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
      </div>

      {/* 消息列表 */}
      <div className="relative z-2 mx-auto -mt-6 flex w-full max-w-[900px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-7 border border-white/60 bg-white/90 p-4 pb-5.5 shadow-[0_18px_54px_rgba(0,0,0,0.08)] backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-200">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[680px] py-[clamp(12px,3vh,28px)]">
            {/* 空状态卡片 */}
            <div className="relative mb-4.5 overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-lg backdrop-blur-sm animate-fade-in-up">
              <div className="absolute -bottom-13.5 -right-7 h-[164px] w-[164px] rounded-full bg-teal-100" />
              <div className="absolute -top-7.5 -left-7.5 h-30 w-30 rounded-full bg-cyan-100" />
              <div className="relative z-1 mx-auto mb-4.5 flex h-18 w-18 items-center justify-center rounded-2xl bg-teal-500 text-3xl text-white shadow-lg shadow-teal-500/20 animate-[pulseGlow_2.5s_infinite]">
                ✈️
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
                  className="inline-flex min-w-[min(260px,100%)] flex-1 basis-[calc(50%-12px)] items-center gap-3 rounded-2xl border border-white/60 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-teal-200 hover:bg-teal-50/50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200 animate-fade-in-up"
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  onClick={() => sendMessage({ text: question })}
                  style={{ animationDelay: `${index * 80}ms` }}
                  type="button"
                >
                  <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-teal-500 text-2.75 font-bold tabular-nums text-white shadow-sm">
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
                <AvatarFallback className="rounded-xl border border-stone-900/6 bg-primary/8 text-3.75">
                  🤖
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
                if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                  return (
                    <pre
                      className="overflow-auto rounded-2xl bg-muted p-3 text-xs"
                      // eslint-disable-next-line react/no-array-index-key
                      key={index}
                    >
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
              <AvatarFallback className="rounded-xl border border-stone-900/6 bg-primary/8 text-3.75">
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
            className="mx-2 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-red-500/20 bg-red-100/80 p-3 px-3.5 text-3.25 font-extrabold text-destructive"
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
          className="mx-auto flex w-full max-w-[900px] items-center gap-2.5 rounded-5 border border-stone-900/8 bg-white p-2"
          onSubmit={handleSubmit}
        >
          <Input
            aria-label="输入消息"
            className="h-11 flex-1 rounded-3.5 border-stone-900/8 bg-white/72 shadow-[inset_0_1px_4px_rgba(41,37,36,0.06)] placeholder:text-stone-900/44 focus:border-primary/44 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.14),inset_0_1px_4px_rgba(41,37,36,0.06)] disabled:text-stone-900/46 disabled:bg-white/42"
            disabled={status !== 'ready'}
            onChange={event => setInput(event.target.value)}
            placeholder="例如：帮我规划杭州 3 天 2 晚，预算 3000 元"
            value={input}
          />
          <Button
            aria-label="发送"
            className="h-11 w-11 flex-shrink-0 rounded-3.5 shadow-[0_12px_24px_rgba(20,184,166,0.34)] hover:-translate-y-px hover:shadow-[0_16px_30px_rgba(20,184,166,0.42)] disabled:text-stone-900/42 disabled:bg-stone-900/10 disabled:shadow-none"
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
