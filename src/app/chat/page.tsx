'use client'

import type { SubmitEvent } from 'react'
import type { ParsedRouteData } from '@/lib/map/route-parser'

import {
  Bot,
  Car,
  Check,
  ChevronDown,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  History,
  Hotel,
  MapPin,
  Plane,
  Plus,
  Route,
  Send,
  Share2,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { TravelRouteCardModal } from '@/components/card/TravelRouteCardModal'
import { TravelMapView } from '@/components/map/TravelMapView'
import { RAGSource } from '@/components/RAGSource'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'
import { extractRagSources } from '@/lib/ai/sources'
import { parseItineraryFromMarkdown } from '@/lib/map/route-parser'
import { useChatHistoryStore } from '@/stores/chatHistory'

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
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [expandedMapMsgIds, setExpandedMapMsgIds] = useState<Record<string, boolean>>({})

  // 卡片弹窗状态
  const [selectedRouteCardData, setSelectedRouteCardData] = useState<ParsedRouteData | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)

  // 滚动容器与自动视角跟焦状态
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const isAutoScrollEnabledRef = useRef<boolean>(true)
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false)

  // AI 对话 Hook
  const { error, messages, sendMessage, setMessages, status, stop } = useTravelChat()
  const isGenerating = status === 'submitted' || status === 'streaming'

  // 会话历史 Store
  const sessions = useChatHistoryStore(state => state.sessions)
  const activeSessionId = useChatHistoryStore(state => state.activeSessionId)
  const _hasHydrated = useChatHistoryStore(state => state._hasHydrated)
  const createSession = useChatHistoryStore(state => state.createSession)
  const saveMessages = useChatHistoryStore(state => state.saveMessages)
  const setActiveSessionId = useChatHistoryStore(state => state.setActiveSessionId)
  const deleteSession = useChatHistoryStore(state => state.deleteSession)
  const clearAllSessions = useChatHistoryStore(state => state.clearAllSessions)

  // 监听容器滚动，智能判断用户是否手动向上回看
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container)
      return
    const { clientHeight, scrollHeight, scrollTop } = container
    // 离底部小于 90px 判定为正在跟随底部
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 90
    isAutoScrollEnabledRef.current = isAtBottom
    setShowScrollBottomBtn(!isAtBottom)
  }, [])

  // 快捷回到底部
  const scrollToBottom = useCallback((smooth = true) => {
    isAutoScrollEnabledRef.current = true
    setShowScrollBottomBtn(false)
    const container = scrollContainerRef.current
    if (container) {
      container.scrollTo({
        behavior: smooth ? 'smooth' : 'instant',
        top: container.scrollHeight,
      })
    }
  }, [])

  // 1. 初始化或水合完成时加载会话
  useEffect(() => {
    if (!_hasHydrated)
      return

    if (activeSessionId) {
      const current = sessions.find(s => s.id === activeSessionId)
      if (current && current.messages.length > 0 && messages.length === 0) {
        setMessages(current.messages)
        const timer = setTimeout(() => scrollToBottom(false), 50)
        return () => clearTimeout(timer)
      }
    }
    else if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id)
      setMessages(sessions[0].messages)
      const timer = setTimeout(() => scrollToBottom(false), 50)
      return () => clearTimeout(timer)
    }
    else {
      const newId = createSession('新的手账对话')
      setActiveSessionId(newId)
    }
  }, [_hasHydrated, activeSessionId, createSession, messages.length, sessions, setActiveSessionId, setMessages, scrollToBottom])

  // 2. 消息变动时自动持久化到当前会话
  useEffect(() => {
    if (!_hasHydrated || !activeSessionId || messages.length === 0)
      return

    // 检测当前消息中的城市
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === 'assistant')
    const assistantText = lastAssistantMsg?.parts
      .filter(p => p.type === 'text')
      .map(p => (p as { text: string }).text)
      .join('\n') || ''
    const detectedCity = extractCity(assistantText) || undefined

    saveMessages(activeSessionId, messages, detectedCity)
  }, [messages, activeSessionId, _hasHydrated, saveMessages])

  // 3. AI 输出流式内容或消息更新时，视窗跟随移动
  useEffect(() => {
    if (!isAutoScrollEnabledRef.current)
      return
    const container = scrollContainerRef.current
    if (container) {
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight
      })
    }
  }, [messages, status])

  // 新建会话
  const handleNewSession = useCallback(() => {
    const newId = createSession('新的手账对话')
    setActiveSessionId(newId)
    setMessages([])
    setInput('')
    setShowHistorySidebar(false)
    isAutoScrollEnabledRef.current = true
    setShowScrollBottomBtn(false)
  }, [createSession, setActiveSessionId, setMessages])

  // 切换会话
  const handleSwitchSession = useCallback((sessionId: string) => {
    const target = sessions.find(s => s.id === sessionId)
    if (!target)
      return
    setActiveSessionId(sessionId)
    setMessages(target.messages || [])
    setInput('')
    setShowHistorySidebar(false)
    const timer = setTimeout(() => scrollToBottom(false), 50)
    return () => clearTimeout(timer)
  }, [sessions, setActiveSessionId, setMessages, scrollToBottom])

  // 表单提交
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isGenerating)
      return

    if (!activeSessionId) {
      const newId = createSession(text.slice(0, 16))
      setActiveSessionId(newId)
    }

    sendMessage({ text })
    setInput('')
    isAutoScrollEnabledRef.current = true
    setShowScrollBottomBtn(false)
    setTimeout(() => scrollToBottom(true), 50)
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // 打开路线卡片生成弹窗
  function handleOpenRouteCard(cleanedText: string, defaultCity?: string) {
    const parsed = parseItineraryFromMarkdown(cleanedText, defaultCity)
    setSelectedRouteCardData(parsed)
    setIsCardModalOpen(true)
  }

  // 切换单条消息的地图视图展开状态
  function toggleMap(messageId: string) {
    setExpandedMapMsgIds(prev => ({
      ...prev,
      [messageId]: !prev[messageId],
    }))
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[#FAF7F0] text-stone-900 relative">
      {/* 历史会话抽屉 / 侧边栏遮罩 */}
      {showHistorySidebar && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/30 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setShowHistorySidebar(false)}
        />
      )}

      {/* 历史会话抽屉面板 */}
      <aside
        className={`fixed left-0 top-0 bottom-0 z-50 w-[300px] sm:w-[340px] bg-[#FDFBF7] border-r border-stone-200/90 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          showHistorySidebar ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 抽屉顶栏 */}
        <div className="flex items-center justify-between border-b border-stone-200/80 p-4 bg-white/60">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-800" />
            <h3 className="font-serif text-sm font-bold text-stone-900">手账对话历史</h3>
            <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold" variant="secondary">
              {sessions.length}
            </Badge>
          </div>
          <button
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            onClick={() => setShowHistorySidebar(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 新建对话操作条 */}
        <div className="p-3 border-b border-stone-200/60 bg-[#FAF7F0]/80">
          <Button
            className="w-full justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-sm shadow-emerald-800/15"
            onClick={handleNewSession}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>开启新手账规划</span>
          </Button>
        </div>

        {/* 会话列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
          {sessions.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              <Compass className="h-8 w-8 mx-auto mb-2 opacity-40 text-stone-400" />
              <p>暂无历史对话记录</p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId
              const timeStr = new Date(session.updatedAt).toLocaleDateString('zh-CN', {
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                month: 'numeric',
              })

              return (
                <div
                  className={`group relative flex items-center justify-between gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/90 border-emerald-300/80 shadow-2xs'
                      : 'bg-white/80 border-stone-200/70 hover:border-emerald-200 hover:bg-white'
                  }`}
                  key={session.id}
                  onClick={() => handleSwitchSession(session.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      {session.city && (
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-100/90 text-emerald-800 text-[10px] font-extrabold shrink-0">
                          {session.city}
                        </span>
                      )}
                      <h4
                        className={`text-xs font-bold truncate ${
                          isActive ? 'text-emerald-950' : 'text-stone-800'
                        }`}
                      >
                        {session.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {timeStr}
                      </span>
                      <span>·</span>
                      <span>
                        {session.messages.length}
                        {' '}
                        条消息
                      </span>
                    </div>
                  </div>

                  <button
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`确定删除会话「${session.title}」吗？`)) {
                        deleteSession(session.id)
                      }
                    }}
                    title="删除会话"
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* 底部清空全部历史 */}
        {sessions.length > 0 && (
          <div className="p-3 border-t border-stone-200/80 bg-white/60">
            <button
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
              onClick={() => {
                if (window.confirm('确定清空所有手账历史会话吗？此操作无法撤销。')) {
                  clearAllSessions()
                  setMessages([])
                }
              }}
              type="button"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>清空全部历史记录</span>
            </button>
          </div>
        )}
      </aside>

      {/* Hero 区域 */}
      <div className="relative flex-shrink-0 overflow-hidden border-b border-stone-200/80 bg-[#FAF7F0] pb-9 pl-5 pr-5 pt-6">
        <div className="relative z-1 mx-auto flex w-full max-w-[920px] items-start justify-between gap-4">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-2.5 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-1">
              <Sparkles className="w-3 h-3 text-emerald-700" />
              <span>AI 旅伴手账专属顾问</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 mt-1">
              手绘视觉路书 & 智能地图规划
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-stone-500">
              告诉我目的地、天数、预算和偏好，为你绘制专属视觉路书、地图路线与可分享卡片。
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* 历史手账抽屉开关 */}
            <Button
              className="flex-shrink-0 gap-1.5 rounded-2xl border-stone-200 bg-white text-stone-700 shadow-2xs hover:bg-stone-100 transition-all cursor-pointer font-bold text-xs"
              onClick={() => setShowHistorySidebar(prev => !prev)}
              size="sm"
              variant="outline"
            >
              <History className="h-4 w-4 text-emerald-700" />
              <span className="hidden sm:inline">历史手账</span>
              {sessions.length > 0 && (
                <span className="h-4 min-w-4 px-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center">
                  {sessions.length}
                </span>
              )}
            </Button>

            {/* 新建对话按钮 */}
            <Button
              className="flex-shrink-0 gap-1 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-all cursor-pointer font-bold text-xs"
              onClick={handleNewSession}
              size="sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">新建</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div
        className="chat-scrollbar relative z-2 mx-auto -mt-4 flex w-full max-w-[920px] flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto overscroll-contain rounded-t-3xl border border-stone-200/80 bg-[#FAF7F0]/60 p-4 pb-8 shadow-[0_10px_30px_rgba(28,25,23,0.04)]"
        onScroll={handleScroll}
        ref={scrollContainerRef}
      >
        {messages.length === 0 && (
          <div className="mx-auto w-full max-w-[700px] py-4 sm:py-8">
            {/* 空状态卡片 */}
            <div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-8 text-center shadow-sm animate-fade-in-up">
              <div className="relative z-1 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-800/20">
                <Plane className="h-7 w-7" />
              </div>
              <h2 className="relative z-1 mb-2 font-serif text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                开启你的手账定制与地图漫游
              </h2>
              <p className="relative z-1 mb-1 text-xs sm:text-sm leading-relaxed text-stone-500">
                输入任何旅行想法，AI 会结合天气、高德路线与本地精选景点为你绘制生动路书与高清卡片
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

          // 解析路线与景点
          const parsedRoute = message.role === 'assistant' && cleanedText
            ? parseItineraryFromMarkdown(cleanedText, detectedCity || undefined)
            : null
          const hasSpots = Boolean(parsedRoute && parsedRoute.spots.length >= 2)
          const isMapExpanded = expandedMapMsgIds[message.id] ?? true

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
                        <div className="flex flex-wrap items-center justify-between border-b border-stone-200/80 pb-3 mb-4 text-xs text-stone-500 gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                            <span>山海行记 · 视觉手账建议</span>
                          </div>

                          {/* 操作按钮区：生成卡片、复制 */}
                          <div className="flex items-center gap-2">
                            {/* 一键生成手账路线卡片按钮 */}
                            <button
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 hover:text-emerald-950 transition-colors cursor-pointer"
                              onClick={() => handleOpenRouteCard(cleanedText, detectedCity || undefined)}
                              title="生成可保存为图片或分享的手账卡片"
                              type="button"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                              <span>生成路线卡片</span>
                            </button>

                            {/* 复制按钮 */}
                            <button
                              className="inline-flex items-center gap-1 text-stone-500 hover:text-emerald-700 transition-colors cursor-pointer px-1 py-1"
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

                        {/* 内嵌真实地图路线规划与模拟导航组件 */}
                        {hasSpots && parsedRoute && (
                          <div className="mt-5 pt-4 border-t border-stone-200/80">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                                <Route className="w-3.5 h-3.5 text-emerald-700" />
                                <span>真实地图路线规划与模拟导航</span>
                              </span>
                              <button
                                className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                                onClick={() => toggleMap(message.id)}
                                type="button"
                              >
                                {isMapExpanded ? '折叠地图 ▲' : '展开地图 ▼'}
                              </button>
                            </div>

                            {isMapExpanded && (
                              <TravelMapView
                                city={parsedRoute.city}
                                initialMode={parsedRoute.transportMode}
                                spots={parsedRoute.spots}
                              />
                            )}
                          </div>
                        )}

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

        {/* 底部定位与垫高 */}
        <div className="h-2 flex-shrink-0" />
      </div>

      {/* 浮动回到底部 / 视角跟随胶囊 */}
      {showScrollBottomBtn && (
        <div className="absolute bottom-[78px] sm:bottom-[86px] right-5 sm:right-10 z-30 animate-fade-in-up">
          <button
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer border border-emerald-600/60 backdrop-blur-sm"
            onClick={() => scrollToBottom(true)}
            type="button"
          >
            <ChevronDown className={`h-4 w-4 ${isGenerating ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{isGenerating ? 'AI 正在输出 · 视角跟随' : '回到底部'}</span>
          </button>
        </div>
      )}

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

      {/* 手账路线卡片生成与分享弹窗 */}
      {selectedRouteCardData && (
        <TravelRouteCardModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          routeData={selectedRouteCardData}
        />
      )}
    </section>
  )
}
