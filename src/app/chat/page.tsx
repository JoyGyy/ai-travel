'use client'

import type { SubmitEvent } from 'react'

import {
  Bot,
  Car,
  Check,
  Compass,
  Copy,
  ExternalLink,
  Hotel,
  MapPin,
  Plane,
  Route,
  Send,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Utensils,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { RAGSource } from '@/components/RAGSource'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'
import { extractRagSources } from '@/lib/ai/sources'

const KNOWN_CITIES = [
  '成都',
  '大理',
  '杭州',
  '西安',
  '北京',
  '上海',
  '重庆',
  '厦门',
  '广州',
  '武汉',
  '青岛',
  '南京',
  '三亚',
  '苏州',
  '长沙',
  '昆明',
  '丽江',
  '桂林',
  '洛阳',
  '敦煌',
]

function sanitizeAiResponse(text: string): string {
  if (!text)
    return ''
  return text
    .replace(/<tools>[\s\S]*?<\/tools>/gi, '')
    .replace(/<tool>[\s\S]*?<\/tool>/gi, '')
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, '')
    .replace(/\{\s*"type"\s*:\s*"function"[\s\S]*?\}/g, '')
    .replace(/工具调用\s*(?:["“]\s*)?<tools>[\s\S]*/gi, '')
    .replace(/工具\s*-\s*\[[\s\S]*?\]/g, '')
    .replace(/\{"工具"[\s\S]*?\}\}/g, '')
    .replace(/^#*\s*travel\s+markdown\s*/gi, '')
    .replace(/(\\s*){4,}/g, '')
    .replace(/("[ \t]*){4,}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function extractCity(text: string): string | null {
  for (const city of KNOWN_CITIES) {
    if (text.includes(city))
      return city
  }
  return null
}

export default function ChatPage() {
  const [input, setInput] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const { error, messages, sendMessage, setMessages, status, stop } = useTravelChat()
  const isGenerating = status === 'submitted' || status === 'streaming'

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isGenerating)
      return
    sendMessage({ text })
    setInput('')
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[#FAF7F0] text-stone-900">
      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden border-b border-stone-200/80 bg-[#FAF7F0] pb-9 pl-5 pr-5 pt-6">
        <div className="relative z-1 mx-auto flex w-full max-w-[920px] items-start justify-between gap-4">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-1">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>AI 旅伴手账专属顾问</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 mt-1">
              手绘视觉路书 & 智能咨询
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-stone-500">
              告诉我目的地、天数、预算和偏好，为你绘制专属视觉路书与地道旅行指南。
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
      <div className="relative z-2 mx-auto -mt-4 flex w-full max-w-[920px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border border-stone-200/80 bg-[#FAF7F0]/60 p-4 pb-6 shadow-[0_10px_30px_rgba(28,25,23,0.04)]">
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[700px] py-4 sm:py-8">
            {/* 空状态卡片 */}
            <div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-8 text-center shadow-sm animate-fade-in-up">
              <div className="relative z-1 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-800/20">
                <Plane className="h-7 w-7" />
              </div>
              <h2 className="relative z-1 mb-2 font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                开启你的手账定制之旅
              </h2>
              <p className="relative z-1 mb-1 text-xs sm:text-sm leading-relaxed text-stone-500">
                输入任何旅行想法，AI 会结合天气、路线与本地精选景点为你规划生动路书
              </p>
              <p className="relative z-1 text-xs text-amber-700 font-medium">💡 点击下方灵感手账快速体验</p>
            </div>

            {/* 快捷问题 */}
            <p className="mb-3 ml-0.5 font-serif text-xs font-bold tracking-wider text-stone-700">
              灵感手账快捷提问
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: '成都美食与大熊猫观赏攻略', desc: '早间看滚滚进食 + 下午漫步奎星楼街地道川味' },
                { title: '大理洱海自驾顺时针与逆时针路线对比', desc: '最佳观海采光、顺光拍照及精品海景客栈推荐' },
                { title: '杭州3天2晚慢节奏烟雨江南行程', desc: '西湖晨雾泛舟、龙井问茶与灵隐静心' },
                { title: '西安4天3晚盛唐文化探索手账', desc: '陕历博特展抢票、大唐不夜城与回民街寻味' },
              ].map((item, index) => (
                <button
                  className="flex items-start gap-3 rounded-2xl border border-stone-200/90 bg-white p-3.5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-700/60 hover:bg-emerald-50/50 hover:shadow-md cursor-pointer animate-fade-in-up"
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  onClick={() => sendMessage({ text: item.title })}
                  style={{ animationDelay: `${index * 80}ms` }}
                  type="button"
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold tabular-nums text-white shadow-2xs mt-0.5">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-stone-800 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const rawText = message.parts
            .filter(part => part.type === 'text')
            .map(part => (part as { text: string }).text)
            .join('\n\n')
          const cleanedText = sanitizeAiResponse(rawText)
          const isToolExecuting = message.parts.some(
            part => part.type.startsWith('tool-') || part.type === 'dynamic-tool',
          )
          const sources = extractRagSources(
            message.parts
              .filter(part => part.type.startsWith('tool-') || part.type === 'dynamic-tool')
              .map(part => (part as { output?: unknown }).output),
          )
          const detectedCity = message.role === 'assistant' ? extractCity(cleanedText) : null

          return (
            <div
              className={
                message.role === 'user'
                  ? 'mx-2 mb-4 text-right'
                  : 'mx-2 mb-4 flex items-start gap-3'
              }
              key={message.id}
            >
              {message.role === 'assistant' && (
                <Avatar className="h-9 w-9 flex-shrink-0 rounded-2xl shadow-sm">
                  <AvatarFallback className="rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-800 font-bold">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={
                  message.role === 'user'
                    ? 'inline-block max-w-[80%] rounded-2xl rounded-tr-xs bg-emerald-700 p-4 px-5 text-white shadow-md shadow-emerald-800/15 text-sm leading-relaxed whitespace-pre-wrap'
                    : 'flex-1 max-w-[92%] sm:max-w-[88%]'
                }
              >
                {message.role === 'user' ? (
                  cleanedText || rawText
                ) : (
                  <>
                    {/* 工具调用加载提示 */}
                    {isToolExecuting && !cleanedText && (
                      <div className="my-2 inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900 shadow-2xs animate-pulse">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                        <span>正在检索当地气象与特色景点知识库...</span>
                      </div>
                    )}

                    {/* AI 回答富文本卡片 */}
                    {cleanedText && (
                      <div className="rounded-3xl rounded-tl-sm border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 text-stone-900 shadow-sm">
                        {/* 手账卡片顶栏 */}
                        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3 mb-4 text-xs text-stone-500">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            <span>山海行记 · 视觉手账建议</span>
                          </div>
                          <button
                            className="inline-flex items-center gap-1 text-stone-500 hover:text-emerald-700 transition-colors cursor-pointer"
                            onClick={() => handleCopy(message.id, cleanedText)}
                            type="button"
                          >
                            {copiedId === message.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-semibold">已复制</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>复制手账</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* 自定义 Markdown 渲染器 */}
                        <div className="text-sm leading-relaxed text-stone-800 space-y-3">
                          <ReactMarkdown
                            components={{
                              blockquote: ({ children }) => (
                                <blockquote className="my-3.5 rounded-2xl border-l-4 border-amber-500 bg-amber-50/80 p-3.5 pl-4 text-stone-800 text-xs shadow-2xs">
                                  <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                                    <Compass className="w-3.5 h-3.5 text-amber-700" />
                                    <span>手账贴士 & 避坑指南</span>
                                  </div>
                                  <div className="leading-relaxed text-stone-700">{children}</div>
                                </blockquote>
                              ),
                              h1: ({ children }) => (
                                <h1 className="font-serif text-lg font-bold text-stone-900 border-b border-emerald-700/20 pb-2 mb-3 mt-4 flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                                  <span>{children}</span>
                                </h1>
                              ),
                              h2: ({ children }) => {
                                const text = String(children)
                                let icon = <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                                if (text.includes('美食') || text.includes('吃'))
                                  icon = <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
                                else if (text.includes('住宿') || text.includes('酒店') || text.includes('民宿'))
                                  icon = <Hotel className="w-4 h-4 text-indigo-600 shrink-0" />
                                else if (text.includes('交通') || text.includes('自驾') || text.includes('出行'))
                                  icon = <Car className="w-4 h-4 text-sky-600 shrink-0" />
                                else if (text.includes('路线') || text.includes('行程'))
                                  icon = <Route className="w-4 h-4 text-emerald-700 shrink-0" />
                                else if (text.includes('贴士') || text.includes('注意') || text.includes('指南'))
                                  icon = <Compass className="w-4 h-4 text-amber-700 shrink-0" />

                                return (
                                  <h2 className="font-serif text-base font-bold text-stone-900 mt-5 mb-2.5 flex items-center gap-2 border-l-4 border-emerald-700 pl-3 py-1 bg-emerald-50/60 rounded-r-xl">
                                    {icon}
                                    <span>{children}</span>
                                  </h2>
                                )
                              },
                              h3: ({ children }) => (
                                <h3 className="font-serif text-sm font-bold text-emerald-950 mt-4 mb-2 flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block shrink-0" />
                                  <span>{children}</span>
                                </h3>
                              ),
                              li: ({ children }) => (
                                <li className="text-stone-700 leading-relaxed flex items-start gap-2 text-xs sm:text-sm my-1">
                                  <span className="text-emerald-700 font-bold shrink-0 mt-0.5">•</span>
                                  <span className="flex-1">{children}</span>
                                </li>
                              ),
                              ol: ({ children }) => (
                                <ol className="my-2.5 space-y-1.5 list-decimal pl-5 text-xs sm:text-sm marker:text-emerald-700 marker:font-bold">
                                  {children}
                                </ol>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-emerald-950 bg-emerald-100/70 px-1.5 py-0.5 rounded text-[13px] mx-0.5">
                                  {children}
                                </strong>
                              ),
                              table: ({ children }) => (
                                <div className="my-3.5 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-2xs">
                                  <table className="min-w-full text-xs text-left divide-y divide-stone-200">
                                    {children}
                                  </table>
                                </div>
                              ),
                              td: ({ children }) => (
                                <td className="px-3.5 py-2.5 text-xs text-stone-700 border-t border-stone-100">
                                  {children}
                                </td>
                              ),
                              th: ({ children }) => (
                                <th className="px-3.5 py-2.5 text-xs font-bold text-stone-800 bg-[#FAF7F0]">
                                  {children}
                                </th>
                              ),
                              ul: ({ children }) => (
                                <ul className="my-2.5 space-y-1.5 list-none pl-0 text-xs sm:text-sm">
                                  {children}
                                </ul>
                              ),
                            }}
                          >
                            {cleanedText}
                          </ReactMarkdown>
                        </div>

                        {/* 智能快捷联动工具栏 */}
                        {detectedCity && (
                          <div className="mt-4 pt-3.5 border-t border-stone-200/80 flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-emerald-700" />
                              <span>
                                {detectedCity}
                                {' '}
                                探索直达:
                              </span>
                            </span>
                            <Link
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
                              href={`/?city=${encodeURIComponent(detectedCity)}`}
                            >
                              <Route className="w-3 h-3" />
                              <span>
                                生成
                                {detectedCity}
                                {' '}
                                专属路书
                              </span>
                            </Link>
                            <Link
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-800 hover:bg-sky-100 transition-colors"
                              href={`/weather?city=${encodeURIComponent(detectedCity)}`}
                            >
                              <Sun className="w-3 h-3" />
                              <span>
                                {detectedCity}
                                {' '}
                                气象预报
                              </span>
                            </Link>
                            <Link
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
                              href={`/attractions?city=${encodeURIComponent(detectedCity)}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>精选景点库</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 知识库引用展示 */}
                    <div className="mt-2">
                      <RAGSource sources={sources} />
                    </div>

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
          className="mx-auto flex w-full max-w-[920px] items-center gap-2.5 rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <Input
            className="h-11 flex-1 rounded-xl border-none bg-transparent pl-3 text-sm text-stone-900 placeholder:text-stone-400 focus-visible:ring-0 shadow-none"
            disabled={isGenerating}
            onChange={event => setInput(event.target.value)}
            placeholder={isGenerating ? 'AI 正在绘制路书中...' : '例如：成都美食与大熊猫观赏攻略'}
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
