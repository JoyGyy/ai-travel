'use client'

import type { FormEvent } from 'react'

import { Bot, Plane, Send, Square, Trash2 } from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { RAGSource } from '@/components/RAGSource'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'
import { extractRagSources } from '@/lib/ai/sources'

function sanitizeAiResponse(text: string): string {
  if (!text)
    return ''
  return text
    .replace(/\{\s*"type"\s*:\s*"function"[\s\S]*?\}/g, '')
    .replace(/工具\s*-\s*\[[\s\S]*?\]/g, '')
    .replace(/\{"工具"[\s\S]*?\}\}/g, '')
    .replace(/("[ \t]*){4,}/g, '')
    .trim()
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const { error, messages, sendMessage, setMessages, status, stop } = useTravelChat()
  const isGenerating = status === 'submitted' || status === 'streaming'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isGenerating)
      return
    sendMessage({ text })
    setInput('')
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[#FAF7F0] text-stone-900">
      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden border-b border-stone-200/80 bg-[#FAF7F0] pb-9 pl-5 pr-5 pt-6">
        <div className="relative z-1 mx-auto flex w-full max-w-[900px] items-start justify-between gap-4">
          <div className="animate-fade-in-up">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-800">
              AI 旅行顾问手账
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900">
              AI 智能旅伴
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-stone-500">
              告诉我目的地、天数、预算和偏好，为你绘制专属视觉路书。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="flex-shrink-0 rounded-2xl border-stone-200 bg-white text-stone-500 shadow-2xs hover:bg-stone-100 hover:text-red-600 transition-all cursor-pointer"
              onClick={() => {
                if (window.confirm('确定要清空对话记录吗？')) {
                  setMessages([])
                }
              }}
              size="icon"
              title="清空对话"
              variant="outline"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="relative z-2 mx-auto -mt-4 flex w-full max-w-[900px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border border-stone-200/80 bg-[#FAF7F0]/60 p-4 pb-6 shadow-[0_10px_30px_rgba(28,25,23,0.04)]">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[680px] py-4 sm:py-8">
            {/* 空状态卡片 */}
            <div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-8 text-center shadow-sm animate-fade-in-up">
              <div className="relative z-1 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-800/20">
                <Plane className="h-7 w-7" />
              </div>
              <h2 className="relative z-1 mb-2 font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                开启你的手账定制之旅
              </h2>
              <p className="relative z-1 mb-1 text-xs sm:text-sm leading-relaxed text-stone-500">
                输入任何旅行想法，AI 会结合天气与本地精选景点为你规划
              </p>
              <p className="relative z-1 text-xs text-amber-700 font-medium">💡 点击下方灵感问题快速体验</p>
            </div>

            {/* 快捷问题 */}
            <p className="mb-3 ml-0.5 font-serif text-xs font-bold tracking-wider text-stone-700">
              灵感手账快捷提问
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                '帮我规划杭州3天2晚慢节奏行程',
                '推荐大理洱海自驾与民宿路线',
                '西安4天3晚盛唐文化探索手账',
                '成都美食与看大熊猫怎么安排',
              ].map((question, index) => (
                <button
                  className="inline-flex min-w-[min(260px,100%)] flex-1 basis-[calc(50%-12px)] items-center gap-3 rounded-2xl border border-stone-200/90 bg-white p-3.5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700/60 hover:bg-emerald-50/50 hover:shadow-md cursor-pointer animate-fade-in-up"
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  onClick={() => sendMessage({ text: question })}
                  style={{ animationDelay: `${index * 80}ms` }}
                  type="button"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold tabular-nums text-white shadow-2xs">
                    {index + 1}
                  </span>
                  <span className="min-w-0 text-xs sm:text-sm font-semibold text-stone-800">
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
                  <AvatarFallback className="rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-800 font-bold">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={
                  message.role === 'user'
                    ? 'inline-block max-w-[75%] rounded-2xl rounded-tr-xs bg-emerald-700 p-3.5 px-4.5 text-white shadow-md shadow-emerald-800/15'
                    : 'flex-1 max-w-[85%]'
                }
              >
                {message.parts.map((part, index) => {
                  if (part.type === 'text') {
                    const cleaned = sanitizeAiResponse(part.text)
                    if (!cleaned)
                      return null
                    return (
                      <div
                        className={
                          message.role === 'user'
                            ? 'm-0 text-sm leading-relaxed whitespace-pre-wrap'
                            : 'rounded-2xl rounded-tl-xs border border-stone-200/90 bg-[#FDFBF7] p-4 text-stone-900 shadow-sm text-sm leading-relaxed prose prose-stone max-w-none'
                        }
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        {message.role === 'user' ? (
                          cleaned
                        ) : (
                          <ReactMarkdown>{cleaned}</ReactMarkdown>
                        )}
                      </div>
                    )
                  }
                  // 工具调用状态
                  if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                    return (
                      <div
                        className="my-1.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900"
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                        <span>正在检索当地气象与景点数据...</span>
                      </div>
                    )
                  }
                  return null
                })}
                {message.role === 'assistant' && (
                  <>
                    <div className="mt-2"><RAGSource sources={sources} /></div>
                    {/* 快捷微调指令胶囊 */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1">
                      {[
                        '💰 帮我优化预算并节省开支',
                        '🍜 推荐路线附近的特色美食',
                        '🌿 增加适合拍照打卡的小众景点',
                        '🚗 提供交通换乘与出行指南',
                      ].map(pill => (
                        <button
                          className="inline-flex items-center gap-1 rounded-full border border-stone-200/90 bg-white/90 px-3 py-1 text-[11px] font-bold text-stone-700 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-emerald-700/60 hover:bg-emerald-50 hover:text-emerald-900 cursor-pointer"
                          disabled={isGenerating}
                          key={pill}
                          onClick={() => sendMessage({ text: pill })}
                          type="button"
                        >
                          <span>{pill}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {status === 'submitted' && (
          <div className="mx-2 mb-3 flex items-start gap-2.5">
            <Avatar className="h-8 w-8 flex-shrink-0 rounded-xl">
              <AvatarFallback className="rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-800">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-1.5 rounded-2xl rounded-tl-xs border border-stone-200/90 bg-[#FDFBF7] p-3 px-4 shadow-sm">
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite] rounded-full bg-emerald-700" />
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.15s] rounded-full bg-emerald-700" />
              <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.3s] rounded-full bg-emerald-700" />
            </div>
          </div>
        )}

        {error && (
          <div
            className="mx-2 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 px-4 text-xs font-semibold text-red-700"
          >
            <span>{error.message}</span>
            <Button
              className="border-red-300 bg-white font-bold text-red-700 hover:bg-red-50 rounded-xl"
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
      <div className="flex-shrink-0 border-t border-stone-200/80 bg-[#FAF7F0] p-3.5 pb-[max(18px,env(safe-area-inset-bottom))] shadow-lg">
        {/* 正在生成时的浮动停止按钮 */}
        {isGenerating && (
          <div className="flex justify-center mb-2 animate-fade-in-up">
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white/95 px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-sm backdrop-blur-sm hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all cursor-pointer"
              onClick={() => stop()}
              type="button"
            >
              <Square className="h-3.5 w-3.5 fill-current text-red-500" />
              <span>停止生成回答</span>
            </button>
          </div>
        )}

        <form
          className="mx-auto flex w-full max-w-[900px] items-center gap-2.5 rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <Input
            className="h-11 flex-1 rounded-xl border-none bg-transparent pl-3 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:ring-0 shadow-none"
            disabled={isGenerating}
            onChange={event => setInput(event.target.value)}
            placeholder={isGenerating ? 'AI 正在绘制路书中...' : '例如：大理洱海自驾，顺时针还是逆时针更好？'}
            value={input}
          />
          {isGenerating ? (
            <Button
              className="h-10 px-3.5 flex-shrink-0 gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-700/20 cursor-pointer"
              onClick={() => stop()}
              title="停止生成"
              type="button"
            >
              <Square className="h-3.5 w-3.5 fill-white" />
              <span className="text-xs font-bold">停止</span>
            </Button>
          ) : (
            <Button
              className="h-10 w-10 flex-shrink-0 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-800/20 disabled:bg-stone-200 disabled:text-stone-400 cursor-pointer"
              disabled={!input.trim()}
              size="icon"
              title="发送"
              type="submit"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </section>
  )
}
