'use client'

import type { SubmitEvent } from 'react'
import type { ParsedRouteData } from '@/lib/map/route-parser'
import {
  Bot,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Compass,
  Copy,
  ExternalLink,
  History,
  Hotel,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Plane,
  Plus,
  Route,
  Send,
  Share2,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Umbrella,
  Utensils,
  Wind,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'

import { TravelRouteCardModal } from '@/components/card/TravelRouteCardModal'
import { TravelMapView } from '@/components/map/TravelMapView'
import { RAGSource } from '@/components/RAGSource'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useTravelChat } from '@/hooks/useTravelChat'
import { useWeather } from '@/hooks/useWeather'
import { extractRagSources } from '@/lib/ai/sources'
import { generateAmapRouteUrl } from '@/lib/map/amap'
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

const QUICK_PROMPTS = [
  { city: '西安', desc: '陕历博特展、大唐不夜城与回民街寻味', title: '西安4天3晚盛唐文化探索手账' },
  { city: '成都', desc: '早起看熊猫吃竹子 + 奎星楼街地道川味', title: '成都美食与大熊猫悠闲3日游' },
  { city: '杭州', desc: '西湖泛舟晨雾、龙井问茶与灵隐祈福', title: '杭州3天2晚慢节奏烟雨江南行程' },
  { city: '大理', desc: '海东顺光自驾、喜洲古镇慢步与海景客栈', title: '大理洱海环海自驾深度路线' },
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
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
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

  // 当前激活的会话对象
  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId)
  }, [sessions, activeSessionId])

  // 当前对话中最近识别到的城市
  const activeCity = useMemo(() => {
    // 优先从最新助手消息中提取
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === 'assistant') {
        const text = msg.parts
          .filter(p => p.type === 'text')
          .map(p => (p as { text: string }).text)
          .join(' ')
        const city = extractCity(text)
        if (city)
          return city
      }
    }
    return activeSession?.city || null
  }, [messages, activeSession])

  // 最新一条包含完整路线的助手消息解析数据（用于右侧行程面板）
  const latestParsedRoute = useMemo<ParsedRouteData | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === 'assistant') {
        const raw = msg.parts
          .filter(p => p.type === 'text')
          .map(p => (p as { text: string }).text)
          .join('\n')
        const cleaned = sanitizeAiResponse(raw)
        if (cleaned) {
          const parsed = parseItineraryFromMarkdown(cleaned, activeCity || undefined)
          if (parsed.spots.length >= 2) {
            return parsed
          }
        }
      }
    }
    return null
  }, [messages, activeCity])

  // 右侧气象挂件
  const { fetchWeather, loading: weatherLoading, weather } = useWeather()
  useEffect(() => {
    if (activeCity) {
      fetchWeather(activeCity)
    }
  }, [activeCity, fetchWeather])

  // 监听容器滚动，智能判断用户是否手动向上回看
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container)
      return
    const { clientHeight, scrollHeight, scrollTop } = container
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
    setShowHistoryDrawer(false)
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
    setShowHistoryDrawer(false)
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
    <div className="flex h-full w-full min-h-0 overflow-hidden bg-[#FAF7F0] text-stone-900">
      {/* ======================================================== */}
      {/* 1. 左侧工作区边栏（桌面常驻 + 移动端抽屉）              */}
      {/* ======================================================== */}
      {/* 移动端遮罩 */}
      {showHistoryDrawer && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setShowHistoryDrawer(false)}
        />
      )}

      {/* 左边栏实体 */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          flex flex-col bg-[#FDFBF7] border-r border-stone-200/90
          transition-all duration-300 ease-in-out shrink-0
          ${showHistoryDrawer ? 'translate-x-0 w-[300px]' : '-translate-x-full lg:translate-x-0'}
          ${showLeftSidebar ? 'lg:w-[270px] xl:w-[290px]' : 'lg:w-0 lg:border-r-0 lg:overflow-hidden'}
        `}
      >
        {/* 左侧顶栏 */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-stone-200/80 bg-white/70">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-800 text-white font-bold shadow-2xs">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-stone-900 leading-tight">山海行记</h2>
              <p className="text-[10px] text-stone-400 font-medium">AI 旅人手账顾问</p>
            </div>
          </div>
          {/* 移动端关闭按钮 */}
          <button
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 lg:hidden cursor-pointer"
            onClick={() => setShowHistoryDrawer(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 新建手账按钮 */}
        <div className="p-3 border-b border-stone-200/60 bg-[#FAF7F0]">
          <Button
            className="w-full justify-center gap-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm shadow-emerald-800/15 cursor-pointer"
            onClick={handleNewSession}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            <span>开启新手账规划</span>
          </Button>
        </div>

        {/* 会话历史列表 */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
          <div className="flex items-center justify-between px-1 mb-1.5 text-[11px] font-bold text-stone-400">
            <span className="flex items-center gap-1">
              <History className="h-3 w-3" />
              <span>历史对话</span>
            </span>
            <span className="text-[10px] bg-stone-100 px-1.5 py-0.2 rounded-full text-stone-600 font-mono">
              {sessions.length}
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              <Compass className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
              <p>暂无历史手账记录</p>
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
                  className={`group relative flex items-center justify-between gap-2 p-2.5 rounded-2xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-2xs font-semibold'
                      : 'bg-white/70 border-stone-200/70 text-stone-700 hover:border-emerald-200 hover:bg-white'
                  }`}
                  key={session.id}
                  onClick={() => handleSwitchSession(session.id)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {session.city && (
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-100/90 text-emerald-800 text-[10px] font-extrabold shrink-0">
                          {session.city}
                        </span>
                      )}
                      <h3
                        className={`text-xs truncate ${
                          isActive ? 'text-emerald-950 font-bold' : 'text-stone-800'
                        }`}
                      >
                        {session.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {timeStr}
                      </span>
                      <span>·</span>
                      <span>
                        {session.messages.length}
                        条
                      </span>
                    </div>
                  </div>

                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm(`确定删除会话「${session.title}」吗？`)) {
                        deleteSession(session.id)
                      }
                    }}
                    title="删除会话"
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })
          )}

          {/* 热门城市快捷检索 */}
          <div className="pt-4 px-1">
            <span className="text-[11px] font-bold text-stone-400 block mb-2">热门目的地直通</span>
            <div className="flex flex-wrap gap-1.5">
              {['西安', '成都', '大理', '杭州', '北京', '三亚'].map(city => (
                <button
                  className="px-2.5 py-1 rounded-xl bg-white border border-stone-200/80 text-[11px] font-bold text-stone-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors cursor-pointer"
                  key={city}
                  onClick={() => sendMessage({ text: `${city}经典游览路线与特色美食打卡推荐` })}
                  type="button"
                >
                  📍
                  {' '}
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 左侧底栏清空历史 */}
        {sessions.length > 0 && (
          <div className="p-2.5 px-3 border-t border-stone-200/80 bg-white/60">
            <button
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
              onClick={() => {
                if (window.confirm('确定清空所有手账历史会话吗？此操作无法撤销。')) {
                  clearAllSessions()
                  setMessages([])
                }
              }}
              type="button"
            >
              <Trash2 className="h-3 w-3" />
              <span>清空全部会话</span>
            </button>
          </div>
        )}
      </aside>

      {/* ======================================================== */}
      {/* 2. 中间主体对话视窗                                      */}
      {/* ======================================================== */}
      <section className="flex flex-1 min-w-0 h-full flex-col bg-[#FAF7F0] relative overflow-hidden">
        {/* 对话视窗顶栏（无多余交叉边框） */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* 左侧边栏切换按钮 */}
            <button
              aria-label={showLeftSidebar ? '收起左侧边栏' : '展开左侧边栏'}
              className="hidden lg:flex p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              onClick={() => setShowLeftSidebar(prev => !prev)}
              title={showLeftSidebar ? '收起左侧边栏' : '展开左侧边栏'}
              type="button"
            >
              {showLeftSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
            <button
              className="flex lg:hidden p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              onClick={() => setShowHistoryDrawer(true)}
              title="打开历史对话"
              type="button"
            >
              <History className="h-4 w-4" />
            </button>

            {/* 会话标题与状态徽章 */}
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="font-serif text-sm sm:text-base font-bold text-stone-900 truncate">
                {activeSession?.title || '手绘视觉路书 & 智能地图规划'}
              </h1>
              {activeCity && (
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                  <MapPin className="w-3 h-3" />
                  {activeCity}
                </span>
              )}
            </div>
          </div>

          {/* 顶栏右侧操作 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* 导出卡片快捷入口 */}
            {latestParsedRoute && (
              <Button
                className="gap-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold shadow-2xs cursor-pointer"
                onClick={() => {
                  setSelectedRouteCardData(latestParsedRoute)
                  setIsCardModalOpen(true)
                }}
                size="sm"
                variant="outline"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">导出手账长图</span>
              </Button>
            )}

            {/* 新建对话按钮 */}
            <Button
              className="gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-2xs cursor-pointer"
              onClick={handleNewSession}
              size="sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">新建</span>
            </Button>

            {/* 右侧边栏切换按钮 */}
            <button
              aria-label={showRightSidebar ? '收起右侧行程看板' : '展开右侧行程看板'}
              className="hidden xl:flex p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
              onClick={() => setShowRightSidebar(prev => !prev)}
              title={showRightSidebar ? '收起右侧行程看板' : '展开右侧行程看板'}
              type="button"
            >
              {showRightSidebar ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* 消息滚动主区域 */}
        <div
          className="chat-scrollbar flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-6"
          onScroll={handleScroll}
          ref={scrollContainerRef}
        >
          {messages.length === 0 && (
            <div className="mx-auto w-full max-w-[760px] py-4 sm:py-8 animate-fade-in">
              {/* 空状态 Hero 引导卡片 */}
              <div className="relative mb-6 overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-7 sm:p-9 text-center shadow-sm">
                <div className="relative z-1 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-800 text-white shadow-md shadow-emerald-900/20">
                  <Plane className="h-6 w-6" />
                </div>
                <h2 className="relative z-1 mb-2 font-serif text-xl sm:text-2xl font-extrabold tracking-tight text-stone-900">
                  开启你的 AI 手账定制与地图漫游
                </h2>
                <p className="relative z-1 mb-2 text-xs sm:text-sm leading-relaxed text-stone-500 max-w-lg mx-auto">
                  告诉我目的地、天数、预算和偏好，AI 将结合实时气象、真实地图路线与本地精选景点为你绘制生动路书与高清手账卡片。
                </p>
                <div className="relative z-1 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/80 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>点击下方灵感手账快速体验</span>
                </div>
              </div>

              {/* 灵感快捷提示词卡片 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUICK_PROMPTS.map((item, index) => (
                  <button
                    className="flex items-start gap-3 rounded-2xl border border-stone-200/90 bg-white p-4 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-600 hover:bg-emerald-50/40 hover:shadow-md cursor-pointer"
                    key={item.title}
                    onClick={() => sendMessage({ text: item.title })}
                    type="button"
                  >
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-xs font-bold text-white shadow-2xs mt-0.5">
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

          {/* 消息流 */}
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

            const parsedRoute = message.role === 'assistant' && cleanedText
              ? parseItineraryFromMarkdown(cleanedText, detectedCity || undefined)
              : null
            const hasSpots = Boolean(parsedRoute && parsedRoute.spots.length >= 2)
            const isMapExpanded = expandedMapMsgIds[message.id] ?? true
            const isLastAssistant = message.id === messages[messages.length - 1]?.id && message.role === 'assistant'
            const isStillGenerating = isGenerating && isLastAssistant

            return (
              <div
                className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                key={message.id}
              >
                {message.role === 'user' ? (
                  /* 用户消息气泡 */
                  <div className="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-tr-xs bg-emerald-800 p-4 px-5 text-white shadow-md shadow-emerald-900/10 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {cleanedText || rawText}
                  </div>
                ) : (
                  /* AI 助手消息卡片 */
                  <div className="flex items-start gap-3 max-w-full sm:max-w-[92%] w-full">
                    <Avatar className="h-9 w-9 flex-shrink-0 rounded-2xl shadow-sm mt-0.5">
                      <AvatarFallback className="rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-800 font-bold">
                        <Bot className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 space-y-3">
                      {/* 工具检索中状态 */}
                      {isToolExecuting && !cleanedText && (
                        <div className="inline-flex flex-wrap items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-medium text-amber-900 shadow-2xs">
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                          <span>正在检索当地气象与特色景点知识库...</span>
                          {isGenerating && (
                            <button
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-amber-300 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer shadow-2xs ml-1"
                              onClick={() => stop()}
                              title="停止生成"
                              type="button"
                            >
                              <Square className="h-2.5 w-2.5 fill-red-600" />
                              <span>停止</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* AI 回复正文卡片 */}
                      {cleanedText && (
                        <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 text-stone-900 shadow-sm">
                          {/* 卡片顶栏 */}
                          <div className="flex flex-wrap items-center justify-between border-b border-stone-200/80 pb-3 mb-4 text-xs text-stone-500 gap-2">
                            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                              <span>山海行记 · 视觉手账建议</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* 生成路线卡片 */}
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                                onClick={() => handleOpenRouteCard(cleanedText, detectedCity || undefined)}
                                title="生成可保存为图片或分享的手账卡片"
                                type="button"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>生成手账卡片</span>
                              </button>

                              {/* 复制文案 */}
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
                                    <span>复制文案</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Markdown 富文本 */}
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

                          {/* 路线与地图呈现 */}
                          {hasSpots && parsedRoute && (
                            <div className="mt-5 pt-4 border-t border-stone-200/80">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                                  <Route className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>真实地图路线规划</span>
                                </span>
                                {!isStillGenerating && (
                                  <button
                                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                                    onClick={() => toggleMap(message.id)}
                                    type="button"
                                  >
                                    {isMapExpanded ? '折叠地图 ▲' : '展开地图 ▼'}
                                  </button>
                                )}
                              </div>

                              {isStillGenerating ? (
                                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 shadow-2xs">
                                  <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-700 text-white font-bold shrink-0 animate-pulse">
                                    <Route className="h-3.5 w-3.5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold flex items-center gap-1.5">
                                      <span>
                                        🗺️ AI 正在规划【
                                        {parsedRoute.city}
                                        】路线拓扑...
                                      </span>
                                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                                        已识别
                                        {' '}
                                        {parsedRoute.spots.length}
                                        {' '}
                                        处打卡点
                                      </span>
                                    </div>
                                    <p className="text-emerald-700/80 text-[11px] mt-0.5 truncate">
                                      规划生成完毕后将自动呈现高德交互全景地图
                                    </p>
                                  </div>
                                </div>
                              ) : (
                                isMapExpanded && (
                                  <TravelMapView
                                    city={parsedRoute.city}
                                    initialMode={parsedRoute.transportMode}
                                    spots={parsedRoute.spots}
                                  />
                                )
                              )}
                            </div>
                          )}

                          {/* 探索直达工具栏 */}
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
                                title={`携带【${detectedCity}】前往首页定制多日完整游程表单`}
                              >
                                <Route className="w-3 h-3" />
                                <span>
                                  去首页定制
                                  {detectedCity}
                                  行程
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

                      {/* 知识库引用 */}
                      <div className="mt-1">
                        <RAGSource sources={sources} />
                      </div>

                      {/* 快捷微调指令胶囊 */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
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
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* 正在连接 AI 状态 */}
          {status === 'submitted' && (
            <div className="flex items-center gap-3 rounded-2xl border border-stone-200/90 bg-[#FDFBF7] p-3 px-4 shadow-sm w-fit animate-fade-in">
              <Avatar className="h-7 w-7 flex-shrink-0 rounded-xl">
                <AvatarFallback className="rounded-xl border border-emerald-200 bg-emerald-100 text-emerald-800">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite] rounded-full bg-emerald-700" />
                <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.15s] rounded-full bg-emerald-700" />
                <span className="h-1.5 w-1.5 animate-[dotBounce_1.2s_infinite_0.3s] rounded-full bg-emerald-700" />
                <span className="text-xs text-stone-500 font-medium ml-1.5">正在连接 AI 规划师...</span>
              </div>
              <button
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-stone-300 text-[11px] font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer shadow-2xs ml-2"
                onClick={() => stop()}
                title="停止生成"
                type="button"
              >
                <Square className="h-2.5 w-2.5 fill-red-600" />
                <span>停止</span>
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-3.5 px-4 text-xs font-semibold text-red-700">
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

          <div className="h-2" />
        </div>

        {/* 浮动回到底部胶囊 */}
        {showScrollBottomBtn && (
          <div className="absolute bottom-[80px] right-6 z-30 animate-fade-in-up">
            <button
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer border border-emerald-600/60"
              onClick={() => scrollToBottom(true)}
              type="button"
            >
              <ChevronDown className={`h-4 w-4 ${isGenerating ? 'animate-bounce text-amber-300' : ''}`} />
              <span>{isGenerating ? '视角跟随' : '回到底部'}</span>
            </button>
          </div>
        )}

        {/* 输入栏（与主视窗一体化设计，边框清晰） */}
        <div className="flex-shrink-0 border-t border-stone-200/80 bg-[#FAF7F0] p-3.5 pb-[max(18px,env(safe-area-inset-bottom))]">
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
            className="mx-auto flex w-full max-w-[800px] items-center gap-2.5 rounded-2xl border border-stone-200/90 bg-white p-1.5 shadow-sm focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all"
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
                className="h-10 w-10 flex-shrink-0 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white shadow-md shadow-emerald-900/20 disabled:bg-stone-200 disabled:text-stone-400 cursor-pointer"
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

      {/* ======================================================== */}
      {/* 3. 右侧智能行程与气象辅助看板（桌面端充实两侧布局）      */}
      {/* ======================================================== */}
      <aside
        className={`
          hidden xl:flex flex-col bg-[#FDFBF7] border-l border-stone-200/90
          transition-all duration-300 ease-in-out shrink-0 overflow-y-auto p-4 space-y-4 no-scrollbar
          ${showRightSidebar ? 'w-[310px] 2xl:w-[350px]' : 'w-0 border-l-0 p-0 overflow-hidden'}
        `}
      >
        {/* 看板顶栏 */}
        <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
          <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>智能行程速览 & 气象看板</span>
          </div>
          {activeCity && (
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold text-[10px]" variant="secondary">
              📍
              {' '}
              {activeCity}
            </Badge>
          )}
        </div>

        {/* 模块 1: 当前行程拓扑透视 */}
        {latestParsedRoute ? (
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1">
                <Route className="w-3.5 h-3.5 text-emerald-700" />
                <span>
                  【
                  {latestParsedRoute.city}
                  】打卡路线
                </span>
              </span>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                共
                {latestParsedRoute.spots.length}
                站
              </span>
            </div>

            {/* 打卡点链条 */}
            <div className="space-y-1.5">
              {latestParsedRoute.spots.map((spot, idx) => (
                <div className="flex items-center gap-2 text-xs" key={spot.name}>
                  <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-800 text-[10px] font-black text-white shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-stone-800 truncate flex-1">{spot.name}</span>
                  {idx < latestParsedRoute.spots.length - 1 && (
                    <ChevronRight className="w-3 h-3 text-stone-300 shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* 快捷操作 */}
            <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
              <Button
                className="flex-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold h-8 cursor-pointer"
                onClick={() => {
                  setSelectedRouteCardData(latestParsedRoute)
                  setIsCardModalOpen(true)
                }}
                size="sm"
              >
                <Share2 className="w-3 h-3 mr-1" />
                <span>导出手账卡片</span>
              </Button>

              <a
                className="inline-flex items-center justify-center px-2.5 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-700 text-[11px] font-bold transition-colors"
                href={generateAmapRouteUrl(
                  latestParsedRoute.spots[0],
                  latestParsedRoute.spots[latestParsedRoute.spots.length - 1],
                  latestParsedRoute.city,
                  'car',
                  latestParsedRoute.spots.slice(1, -1),
                )}
                rel="noreferrer"
                target="_blank"
                title="在高德地图中打开全程导航"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white/60 p-4 text-center text-xs text-stone-400">
            <Route className="h-6 w-6 mx-auto mb-1.5 opacity-40 text-emerald-700" />
            <p className="font-medium text-stone-600 mb-0.5">暂无解析路线</p>
            <p className="text-[11px]">向 AI 发送城市旅行规划，右侧将自动呈现打卡清单与导航透视</p>
          </div>
        )}

        {/* 模块 2: 当前目的地实时气象 */}
        {activeCity && (
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>
                  {activeCity}
                  实时气象
                </span>
              </span>
              <Link
                className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center gap-0.5"
                href={`/weather?city=${encodeURIComponent(activeCity)}`}
              >
                <span>7日预报</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>

            {weatherLoading ? (
              <div className="py-3 text-center text-xs text-stone-400 animate-pulse">
                正在同步气象台数据...
              </div>
            ) : weather ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <div>
                    <div className="text-xl font-serif font-black text-stone-900">
                      {weather.temperature}
                      °C
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium">{weather.weatherDesc}</div>
                  </div>
                  <div className="text-right text-[10px] text-stone-400 space-y-0.5">
                    {weather.humidity !== undefined && (
                      <div className="flex items-center justify-end gap-1">
                        <Umbrella className="w-3 h-3 text-sky-500" />
                        <span>
                          湿度
                          {' '}
                          {weather.humidity}
                          %
                        </span>
                      </div>
                    )}
                    {weather.feelsLike !== undefined && (
                      <div className="flex items-center justify-end gap-1">
                        <Wind className="w-3 h-3 text-emerald-600" />
                        <span>
                          体感
                          {' '}
                          {weather.feelsLike}
                          °C
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-stone-600 bg-amber-50/70 border border-amber-200/60 p-2 rounded-xl flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    出行建议：气温适宜，
                    {weather.weatherDesc.includes('雨') ? '请携带雨具并注意防滑' : '适合户外漫游与拍照打卡'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-stone-400 py-2 text-center">暂未获取到实时天气</div>
            )}
          </div>
        )}

        {/* 模块 3: 美食风味小抄 */}
        {latestParsedRoute && latestParsedRoute.food.length > 0 && (
          <div className="rounded-2xl border border-stone-200/90 bg-white p-4 shadow-2xs space-y-2">
            <div className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-600" />
              <span>特色风味小抄</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {latestParsedRoute.food.map(f => (
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900"
                  key={f}
                >
                  🍜
                  {' '}
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 模块 4: 旅人出行指南便签 */}
        <div className="rounded-2xl border border-stone-200/90 bg-emerald-900 text-white p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
            <Compass className="w-3.5 h-3.5" />
            <span>旅人手账贴士</span>
          </div>
          <p className="text-[11px] text-emerald-100/90 leading-relaxed">
            热门历史博物馆（如陕历博、故宫）通常需提前 3-7 天预约特展门票；自驾前请留意沿途路况与潮汐天气。
          </p>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 4. 手账路线卡片生成与分享弹窗                            */}
      {/* ======================================================== */}
      {selectedRouteCardData && (
        <TravelRouteCardModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          routeData={selectedRouteCardData}
        />
      )}
    </div>
  )
}
