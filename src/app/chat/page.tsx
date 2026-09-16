'use client';

import type { SubmitEvent } from 'react';
import type { ParsedRouteData } from '@/lib/map/route-parser';
import type { ChatSession } from '@/stores/chatHistory';
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
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { TravelRouteCardModal } from '@/components/card/TravelRouteCardModal';
import { InlinePoiCard } from '@/components/chat/InlinePoiCard';
import { ThinkingAccordion } from '@/components/chat/ThinkingAccordion';
import { TravelMapSkeleton } from '@/components/map/TravelMapSkeleton';
import { RAGSource } from '@/components/RAGSource';
import { ResizeHandle } from '@/components/workspace/ResizeHandle';

const TravelMapView = dynamic(
  () =>
    import('@/components/map/TravelMapView').then((mod) => mod.TravelMapView),
  {
    ssr: false,
    loading: () => <TravelMapSkeleton />,
  },
);
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAppToast } from '@/hooks/useAppToast';
import { useTravelChat } from '@/hooks/useTravelChat';
import { useWeather } from '@/hooks/useWeather';
import { extractRagSources } from '@/lib/ai/sources';
import { generateAmapRouteUrl } from '@/lib/map/amap';
import { parseItineraryFromMarkdown } from '@/lib/map/route-parser';
import { useAuthStore } from '@/stores/auth';
import { useChatHistoryStore } from '@/stores/chatHistory';
import { useItineraryWorkspaceStore } from '@/stores/itineraryWorkspace';
import { recordTTFT } from '@/lib/telemetry/metrics';

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
];

const QUICK_PROMPTS = [
  {
    city: '西安',
    desc: '陕历博特展、大唐不夜城与回民街寻味',
    title: '西安4天3晚盛唐文化探索手账',
  },
  {
    city: '成都',
    desc: '早起看熊猫吃竹子 + 奎星楼街地道川味',
    title: '成都美食与大熊猫悠闲3日游',
  },
  {
    city: '杭州',
    desc: '西湖泛舟晨雾、龙井问茶与灵隐祈福',
    title: '杭州3天2晚慢节奏烟雨江南行程',
  },
  {
    city: '大理',
    desc: '海东顺光自驾、喜洲古镇慢步与海景客栈',
    title: '大理洱海环海自驾深度路线',
  },
];

function sanitizeAiResponse(text: string): string {
  if (!text) return '';
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
    .trim();
}

function extractCity(text: string): string | null {
  for (const city of KNOWN_CITIES) {
    if (text.includes(city)) return city;
  }
  return null;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const initialCity = searchParams.get('city');
  const hasTriggeredRef = useRef(false);

  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightMap, setShowRightMap] = useState(true);
  const [mobileActiveTab, setMobileActiveTab] = useState<'chat' | 'map'>(
    'chat',
  );

  // 卡片弹窗状态
  const [selectedRouteCardData, setSelectedRouteCardData] =
    useState<ParsedRouteData | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);

  // 栏目宽度调节状态（支持本地记忆，默认 460px 舒适阅读宽度）
  const [chatWidth, setChatWidth] = useState<number>(460);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('travel_workspace_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.chat === 'number' && parsed.chat >= 320) {
          setChatWidth(parsed.chat);
        }
      }
    } catch {}
  }, []);

  const saveWidths = useCallback(
    (newChat?: number) => {
      try {
        const c = newChat ?? chatWidth;
        localStorage.setItem(
          'travel_workspace_widths',
          JSON.stringify({ chat: c }),
        );
      } catch {}
    },
    [chatWidth],
  );

  // 滚动容器与自动视角跟焦状态
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollEnabledRef = useRef<boolean>(true);
  const isProgrammaticScrollRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number>(0);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  // AI 对话 Hook
  const { error, messages, sendMessage, setMessages, status, stop } =
    useTravelChat();
  const isGenerating = status === 'submitted' || status === 'streaming';

  // 会话历史 Store
  const sessions = useChatHistoryStore((state) => state.sessions);
  const activeSessionId = useChatHistoryStore((state) => state.activeSessionId);
  const _hasHydrated = useChatHistoryStore((state) => state._hasHydrated);
  const createSession = useChatHistoryStore((state) => state.createSession);
  const saveMessages = useChatHistoryStore((state) => state.saveMessages);
  const setActiveSessionId = useChatHistoryStore(
    (state) => state.setActiveSessionId,
  );
  const deleteSession = useChatHistoryStore((state) => state.deleteSession);
  const clearAllSessions = useChatHistoryStore(
    (state) => state.clearAllSessions,
  );

  // 测量 AI 流式首字返回延迟 (TTFT)
  const requestStartTimeRef = useRef<number | null>(null);
  useEffect(() => {
    if (status === 'submitted') {
      requestStartTimeRef.current = Date.now();
    } else if (status === 'streaming' && requestStartTimeRef.current !== null) {
      const elapsed = Date.now() - requestStartTimeRef.current;
      recordTTFT(elapsed, {
        sessionId: activeSessionId,
      });
      requestStartTimeRef.current = null;
    } else if (status === 'ready' || status === 'error') {
      requestStartTimeRef.current = null;
    }
  }, [status, activeSessionId]);

  // 用 ref 持有最新 status 与 stop，供卸载清理函数读取，
  // 确保清理只在真正卸载时执行，避免 status 变化触发清理而误中止流式响应。
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const stopRef = useRef(stop);
  useEffect(() => {
    stopRef.current = stop;
  }, [stop]);

  // 认证状态与用户感知
  const user = useAuthStore((state) => state.user);
  const authHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    if (authHydrated) {
      useChatHistoryStore
        .getState()
        .initForUser(user?.id || null)
        .catch(() => {});
    }
  }, [authHydrated, user?.id]);

  // 会话删除弹窗状态
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(
    null,
  );
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const toast = useAppToast();

  const handleConfirmDeleteSession = () => {
    if (!sessionToDelete) return;
    const title = sessionToDelete.title;
    deleteSession(sessionToDelete.id);
    if (activeSessionId === sessionToDelete.id) {
      setMessages([]);
    }
    setSessionToDelete(null);
    toast.success(`已删除会话「${title}」`);
  };

  const handleConfirmClearAll = () => {
    clearAllSessions();
    setMessages([]);
    setShowClearAllDialog(false);
    toast.success('已清空所有历史手账对话');
  };

  // 当前激活的会话对象
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId);
  }, [sessions, activeSessionId]);

  // 当前对话中最近识别到的城市
  const activeCity = useMemo(() => {
    // 优先从最新助手消息中提取
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant') {
        const text = msg.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { text: string }).text)
          .join(' ');
        const city = extractCity(text);
        if (city) return city;
      }
    }
    return activeSession?.city || initialCity || null;
  }, [messages, activeSession, initialCity]);

  // 最新一条包含完整路线的助手消息解析数据（用于右侧行程面板）
  const latestParsedRoute = useMemo<ParsedRouteData | null>(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant') {
        const raw = msg.parts
          .filter((p) => p.type === 'text')
          .map((p) => (p as { text: string }).text)
          .join('\n');
        const cleaned = sanitizeAiResponse(raw);
        if (cleaned) {
          const parsed = parseItineraryFromMarkdown(
            cleaned,
            activeCity || undefined,
          );
          if (parsed.spots.length >= 2) {
            return parsed;
          }
        }
      }
    }
    return null;
  }, [messages, activeCity]);

  // 同步最新解析行程至多日工作台协同状态机
  const lastSyncedSignatureRef = useRef<string>('');

  useEffect(() => {
    if (!latestParsedRoute) return;
    // 关键优化：流式生成过程中不频繁将未完稿同步到工作台，避免 token 级反复触发 Store 级联重绘
    if (isGenerating) return;

    const currentSig = `${latestParsedRoute.city}-${latestParsedRoute.spots.map((s) => s.name).join(',')}`;
    if (lastSyncedSignatureRef.current === currentSig) return;

    lastSyncedSignatureRef.current = currentSig;
    useItineraryWorkspaceStore
      .getState()
      .initFromParsedRoute(latestParsedRoute, activeSession?.title);
  }, [latestParsedRoute, activeSession?.title, isGenerating]);

  useEffect(() => {
    useItineraryWorkspaceStore.getState().setIsGenerating(isGenerating);
  }, [isGenerating]);

  // 右侧气象挂件
  const { fetchWeather, loading: weatherLoading, weather } = useWeather();
  useEffect(() => {
    if (activeCity) {
      fetchWeather(activeCity);
    }
  }, [activeCity, fetchWeather]);

  // 监听容器滚动，智能判断用户是否手动向上回看
  const handleScroll = useCallback(() => {
    // 若本次滚动由程序自动吸底触发，忽略该事件，避免重置用户的交互状态
    if (isProgrammaticScrollRef.current) {
      isProgrammaticScrollRef.current = false;
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;
    const { clientHeight, scrollHeight, scrollTop } = container;
    // 距离底部 30px 以内认为贴底，重新恢复自动吸底；否则保持用户回看状态
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isAtBottom = distanceFromBottom <= 30;
    isAutoScrollEnabledRef.current = isAtBottom;
    setShowScrollBottomBtn(!isAtBottom);
  }, []);

  // 鼠标滚轮监听：只要向上滚（deltaY < 0），瞬间切断自动跟随，避免被流式输出拖回底部
  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY < 0) {
      isAutoScrollEnabledRef.current = false;
      setShowScrollBottomBtn(true);
    }
  }, []);

  // 触屏滑动监听：支持手机与触控板手势向上回看
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const currentY = e.touches[0].clientY;
      // 手指向下滑动（查看上方历史内容）
      if (currentY - touchStartYRef.current > 5) {
        isAutoScrollEnabledRef.current = false;
        setShowScrollBottomBtn(true);
      }
    }
  }, []);

  // 快捷回到底部
  const scrollToBottom = useCallback((smooth = true) => {
    isAutoScrollEnabledRef.current = true;
    setShowScrollBottomBtn(false);
    const container = scrollContainerRef.current;
    if (container) {
      isProgrammaticScrollRef.current = true;
      container.scrollTo({
        behavior: smooth ? 'smooth' : 'instant',
        top: container.scrollHeight,
      });
    }
  }, []);

  const hasInitializedSessionRef = useRef(false);

  // 1. 初始化或水合完成时加载会话或处理来自首页的定制请求
  useEffect(() => {
    if (!_hasHydrated) return;
    if (hasInitializedSessionRef.current) return;

    if (!hasTriggeredRef.current) {
      if (initialPrompt) {
        hasTriggeredRef.current = true;
        hasInitializedSessionRef.current = true;
        const newId = createSession(
          initialCity ? `【${initialCity}】行程手账` : '定制行程手账',
        );
        setActiveSessionId(newId);
        setMessages([]);
        sendMessage({ text: initialPrompt });
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/chat');
        }
        return;
      }
      if (initialCity && messages.length === 0) {
        hasTriggeredRef.current = true;
        hasInitializedSessionRef.current = true;
        const newId = createSession(`【${initialCity}】行程手账`);
        setActiveSessionId(newId);
        setMessages([]);
        sendMessage({
          text: `请帮我规划一份前往【${initialCity}】的经典旅行手账路线，包含必去景点打卡、地道美食推荐与出行避坑贴士。`,
        });
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', '/chat');
        }
        return;
      }
    }

    if (activeSessionId) {
      const current = sessions.find((s) => s.id === activeSessionId);
      if (current && current.messages.length > 0 && messages.length === 0) {
        setMessages(current.messages);
        hasInitializedSessionRef.current = true;
        const timer = setTimeout(() => scrollToBottom(false), 50);
        return () => clearTimeout(timer);
      } else if (current) {
        hasInitializedSessionRef.current = true;
      }
    } else if (sessions.length > 0) {
      setActiveSessionId(sessions[0].id);
      setMessages(sessions[0].messages);
      hasInitializedSessionRef.current = true;
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    } else {
      const newId = createSession('新的手账对话');
      setActiveSessionId(newId);
      hasInitializedSessionRef.current = true;
    }
  }, [
    _hasHydrated,
    initialPrompt,
    initialCity,
    activeSessionId,
    createSession,
    messages.length,
    sessions,
    setActiveSessionId,
    setMessages,
    sendMessage,
    scrollToBottom,
  ]);

  // 离开页面或卸载组件时终止进行中的流式请求
  // 注意：依赖数组必须为空，清理函数只在真正卸载时执行一次；status 通过 ref 读取最新值，
  // 否则 status 变化时清理函数会反复执行，导致流式请求刚生成首个 token 就被 stop() 中止。
  useEffect(() => {
    return () => {
      if (
        statusRef.current === 'streaming' ||
        statusRef.current === 'submitted'
      ) {
        stopRef.current();
      }
    };
  }, []);

  // 2. 消息变动或生成状态变化时自动持久化到当前会话
  useEffect(() => {
    if (!_hasHydrated || !activeSessionId || messages.length === 0) return;
    // 关键优化：流式生成过程中不频繁写入存储，避免每个 token 触发全局 Store 级联重绘
    if (status === 'streaming') return;

    const lastAssistantMsg = [...messages]
      .reverse()
      .find((m) => m.role === 'assistant');
    const assistantText =
      lastAssistantMsg?.parts
        .filter((p) => p.type === 'text')
        .map((p) => (p as { text: string }).text)
        .join('\n') || '';
    const detectedCity = extractCity(assistantText) || undefined;

    saveMessages(activeSessionId, messages, detectedCity);
  }, [messages, activeSessionId, _hasHydrated, saveMessages, status]);

  // 3. AI 输出流式内容或消息更新时，视窗跟随移动
  useEffect(() => {
    if (!isAutoScrollEnabledRef.current) return;
    const container = scrollContainerRef.current;
    if (container) {
      isProgrammaticScrollRef.current = true;
      requestAnimationFrame(() => {
        if (!isAutoScrollEnabledRef.current) return;
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages, status]);

  // 新建会话
  const handleNewSession = useCallback(() => {
    const newId = createSession('新的手账对话');
    setActiveSessionId(newId);
    setMessages([]);
    setInput('');
    setShowHistoryDrawer(false);
    isAutoScrollEnabledRef.current = true;
    setShowScrollBottomBtn(false);
    lastSyncedSignatureRef.current = '';
    useItineraryWorkspaceStore.getState().clearWorkspace();
  }, [createSession, setActiveSessionId, setMessages]);

  // 切换会话
  const handleSwitchSession = useCallback(
    (sessionId: string) => {
      const target = sessions.find((s) => s.id === sessionId);
      if (!target) return;
      setActiveSessionId(sessionId);
      setMessages(target.messages || []);
      setInput('');
      setShowHistoryDrawer(false);
      lastSyncedSignatureRef.current = '';
      const timer = setTimeout(() => scrollToBottom(false), 50);
      return () => clearTimeout(timer);
    },
    [sessions, setActiveSessionId, setMessages, scrollToBottom],
  );

  // 表单提交
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isGenerating) return;

    if (!activeSessionId) {
      const newId = createSession(text.slice(0, 16));
      setActiveSessionId(newId);
    }

    sendMessage({ text });
    setInput('');
    isAutoScrollEnabledRef.current = true;
    setShowScrollBottomBtn(false);
    setTimeout(() => scrollToBottom(true), 50);
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // 打开路线卡片生成弹窗
  function handleOpenRouteCard(cleanedText: string, defaultCity?: string) {
    const parsed = parseItineraryFromMarkdown(cleanedText, defaultCity);
    setSelectedRouteCardData(parsed);
    setIsCardModalOpen(true);
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
        {/* 左侧顶栏：手账历史导航 */}
        <div className="flex items-center justify-between p-3.5 px-4 border-b border-stone-200/80 bg-white/70">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              <History className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-serif text-sm font-bold text-stone-900 leading-tight">
                手账历史
              </h2>
              <p className="text-[10px] text-stone-400 font-medium">
                AI 行程规划记录
              </p>
            </div>
          </div>
          {/* 桌面端收起历史侧栏按钮 (放在历史记录栏内) */}
          <button
            aria-label="收起手账历史"
            className="hidden lg:flex p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            onClick={() => setShowLeftSidebar(false)}
            title="收起手账历史"
            type="button"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
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
              const isActive = session.id === activeSessionId;
              const timeStr = new Date(session.updatedAt).toLocaleDateString(
                'zh-CN',
                {
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  month: 'numeric',
                },
              );

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
                          isActive
                            ? 'text-emerald-950 font-bold'
                            : 'text-stone-800'
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
                      <span>{session.messages.length}条</span>
                    </div>
                  </div>

                  <button
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(session);
                    }}
                    title="删除会话"
                    type="button"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              );
            })
          )}

          {/* 热门城市快捷检索 */}
          <div className="pt-4 px-1">
            <span className="text-[11px] font-bold text-stone-400 block mb-2">
              热门目的地直通
            </span>
            <div className="flex flex-wrap gap-1.5">
              {['西安', '成都', '大理', '杭州', '北京', '三亚'].map((city) => (
                <button
                  className="px-2.5 py-1 rounded-xl bg-white border border-stone-200/80 text-[11px] font-bold text-stone-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition-colors cursor-pointer"
                  key={city}
                  onClick={() =>
                    sendMessage({
                      text: `${city}经典游览路线与特色美食打卡推荐`,
                    })
                  }
                  type="button"
                >
                  📍 {city}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 左侧底栏清空历史 */}
        {sessions.length > 0 && (
          <div className="p-2.5 px-3 border-t border-stone-200/80 bg-white/60">
            <button
              className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-stone-400 hover:text-red-600 transition-colors cursor-pointer font-medium"
              onClick={() => setShowClearAllDialog(true)}
              type="button"
            >
              <Trash2 className="h-3 w-3" />
              <span>清空全部会话</span>
            </button>
          </div>
        )}
      </aside>

      {/* ======================================================== */}
      {/* 2. 第一栏：AI 对话与思考视窗                              */}
      {/* ======================================================== */}
      <section
        className={`
          flex-col h-full bg-[#FAF7F0] relative overflow-hidden border-r border-stone-200/90
          ${mobileActiveTab === 'chat' ? 'flex flex-1 min-w-0' : 'hidden'}
          lg:flex ${showRightMap ? 'lg:flex-none shrink-0' : 'lg:flex-1 lg:min-w-0'}
        `}
        style={showRightMap ? { width: `${chatWidth}px` } : undefined}
      >
        {/* 对话视窗顶栏（无多余交叉边框） */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur-md z-10">
          <div className="flex items-center gap-2 min-w-0">
            {/* 仅在左侧栏收起时，在对话栏顶栏左侧展示“展开手账历史”按钮 */}
            {!showLeftSidebar && (
              <button
                aria-label="展开手账历史"
                className="hidden lg:flex p-1.5 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
                onClick={() => setShowLeftSidebar(true)}
                title="展开手账历史"
                type="button"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* 移动端视图切换 Tabs */}
            <div className="flex lg:hidden items-center bg-stone-100 p-0.5 rounded-xl text-xs font-bold border border-stone-200/80">
              <button
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${mobileActiveTab === 'chat' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500'}`}
                onClick={() => setMobileActiveTab('chat')}
                type="button"
              >
                💬 对话
              </button>
              <button
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${mobileActiveTab === 'map' ? 'bg-white text-emerald-800 shadow-2xs' : 'text-stone-500'}`}
                onClick={() => setMobileActiveTab('map')}
                type="button"
              >
                🗺️ 地图 & 行程
              </button>
            </div>

            {/* 桌面端大地图展开快捷入口（仅在右侧地图收起时在对话栏呈现；地图开启时由地图顶栏自身收起） */}
            {!showRightMap && (
              <Button
                className="gap-1.5 rounded-xl text-xs font-bold h-8 px-2.5 bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs cursor-pointer transition-all"
                onClick={() => setShowRightMap(true)}
                size="sm"
                title="展开联动大地图"
                variant="outline"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
                <span>展开地图</span>
              </Button>
            )}

            {/* 导出卡片快捷入口 */}
            {latestParsedRoute && (
              <Button
                className="gap-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-bold shadow-2xs cursor-pointer"
                onClick={() => {
                  setSelectedRouteCardData(latestParsedRoute);
                  setIsCardModalOpen(true);
                }}
                size="sm"
                variant="outline"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">导出手账</span>
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
          </div>
        </header>

        {/* 消息滚动主区域 */}
        <div
          className="chat-scrollbar flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-6 space-y-6"
          onScroll={handleScroll}
          onTouchMove={handleTouchMove}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
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
                  告诉我目的地、天数、预算和偏好，AI
                  将结合实时气象、真实地图路线与本地精选景点为你绘制生动路书与高清手账卡片。
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
              .filter((part) => part.type === 'text')
              .map((part) => (part as { text: string }).text)
              .join('\n\n');
            const cleanedText = sanitizeAiResponse(rawText);
            const isToolExecuting = message.parts.some(
              (part) =>
                part.type.startsWith('tool-') || part.type === 'dynamic-tool',
            );
            const sources = extractRagSources(
              message.parts
                .filter(
                  (part) =>
                    part.type.startsWith('tool-') ||
                    part.type === 'dynamic-tool',
                )
                .map((part) => (part as { output?: unknown }).output),
            );
            const detectedCity =
              message.role === 'assistant' ? extractCity(cleanedText) : null;

            const parsedRoute =
              message.role === 'assistant' && cleanedText
                ? parseItineraryFromMarkdown(
                    cleanedText,
                    detectedCity || undefined,
                  )
                : null;
            const hasSpots = Boolean(
              parsedRoute && parsedRoute.spots.length >= 2,
            );
            const isLastAssistant =
              message.id === messages[messages.length - 1]?.id &&
              message.role === 'assistant';
            const isStillGenerating = isGenerating && isLastAssistant;

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
                              <span>远方 AI · 行程手账建议</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* 生成路线卡片 */}
                              <button
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                                onClick={() =>
                                  handleOpenRouteCard(
                                    cleanedText,
                                    detectedCity || undefined,
                                  )
                                }
                                title="生成可保存为图片或分享的手账卡片"
                                type="button"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>生成手账卡片</span>
                              </button>

                              {/* 复制文案 */}
                              <button
                                className="inline-flex items-center gap-1 text-stone-500 hover:text-emerald-700 transition-colors cursor-pointer px-1 py-1"
                                onClick={() =>
                                  handleCopy(message.id, cleanedText)
                                }
                                type="button"
                              >
                                {copiedId === message.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-emerald-600 font-semibold">
                                      已复制
                                    </span>
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

                          {/* 深度思考推演折叠区 (对标 DeepSeek-R1 / 携程深度思考) */}
                          <ThinkingAccordion isGenerating={isStillGenerating} />

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
                                    <div className="leading-relaxed text-stone-700">
                                      {children}
                                    </div>
                                  </blockquote>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="font-serif text-lg font-bold text-stone-900 border-b border-emerald-700/20 pb-2 mb-3 mt-4 flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span>{children}</span>
                                  </h1>
                                ),
                                h2: ({ children }) => {
                                  const text = String(children);
                                  let icon = (
                                    <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                                  );
                                  if (
                                    text.includes('美食') ||
                                    text.includes('吃')
                                  )
                                    icon = (
                                      <Utensils className="w-4 h-4 text-amber-600 shrink-0" />
                                    );
                                  else if (
                                    text.includes('住宿') ||
                                    text.includes('酒店') ||
                                    text.includes('民宿')
                                  )
                                    icon = (
                                      <Hotel className="w-4 h-4 text-indigo-600 shrink-0" />
                                    );
                                  else if (
                                    text.includes('交通') ||
                                    text.includes('自驾') ||
                                    text.includes('出行')
                                  )
                                    icon = (
                                      <Car className="w-4 h-4 text-sky-600 shrink-0" />
                                    );
                                  else if (
                                    text.includes('路线') ||
                                    text.includes('行程')
                                  )
                                    icon = (
                                      <Route className="w-4 h-4 text-emerald-700 shrink-0" />
                                    );
                                  else if (
                                    text.includes('贴士') ||
                                    text.includes('注意') ||
                                    text.includes('指南')
                                  )
                                    icon = (
                                      <Compass className="w-4 h-4 text-amber-700 shrink-0" />
                                    );

                                  return (
                                    <h2 className="font-serif text-base font-bold text-stone-900 mt-5 mb-2.5 flex items-center gap-2 border-l-4 border-emerald-700 pl-3 py-1 bg-emerald-50/60 rounded-r-xl">
                                      {icon}
                                      <span>{children}</span>
                                    </h2>
                                  );
                                },
                                h3: ({ children }) => (
                                  <h3 className="font-serif text-sm font-bold text-emerald-950 mt-4 mb-2 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-700 inline-block shrink-0" />
                                    <span>{children}</span>
                                  </h3>
                                ),
                                li: ({ children }) => (
                                  <li className="text-stone-700 leading-relaxed flex items-start gap-2 text-xs sm:text-sm my-1">
                                    <span className="text-emerald-700 font-bold shrink-0 mt-0.5">
                                      •
                                    </span>
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

                          {/* 图文打卡微卡片序列 (对标携程线路明细微卡片) */}
                          {hasSpots && parsedRoute && (
                            <div className="mt-4 pt-3.5 border-t border-stone-200/80 space-y-2">
                              <div className="flex items-center justify-between text-xs text-stone-500 font-bold">
                                <span className="flex items-center gap-1.5 text-emerald-800">
                                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                  <span>
                                    打卡点位快捷透视 (可联动看板与地图)
                                  </span>
                                </span>
                                <span className="text-[10px] text-stone-400">
                                  共 {parsedRoute.spots.length} 处
                                </span>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {parsedRoute.spots.map((sp) => (
                                  <InlinePoiCard
                                    city={parsedRoute.city}
                                    coverImage={sp.coverImage}
                                    durationText={sp.durationText}
                                    key={sp.name}
                                    name={sp.name}
                                    rating={sp.rating}
                                  />
                                ))}
                              </div>
                            </div>
                          )}


                          {/* 探索直达工具栏 */}
                          {detectedCity && (
                            <div className="mt-4 pt-3.5 border-t border-stone-200/80 flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-stone-500 flex items-center gap-1">
                                <Compass className="w-3.5 h-3.5 text-emerald-700" />
                                <span>{detectedCity} 探索直达:</span>
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
                                <span>{detectedCity} 气象预报</span>
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
                        ].map((pill) => (
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
            );
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
                <span className="text-xs text-stone-500 font-medium ml-1.5">
                  正在连接 AI 规划师...
                </span>
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
              <ChevronDown
                className={`h-4 w-4 ${isGenerating ? 'animate-bounce text-amber-300' : ''}`}
              />
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
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                isGenerating
                  ? 'AI 正在绘制路书中...'
                  : '例如：成都美食与大熊猫观赏攻略'
              }
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

      {/* 对话栏与联动地图之间的拖拽手柄 */}
      {showRightMap && (
        <ResizeHandle
          ariaLabel="调节对话与地图分栏宽度"
          maxWidth={850}
          minWidth={360}
          onResize={(w) => setChatWidth(w)}
          onResizeEnd={(w) => saveWidths(w)}
          width={chatWidth}
        />
      )}

      {/* ======================================================== */}
      {/* 2. 第二栏：联动大地图与多日行程工作台 (对标携程/高德 Map Explorer) */}
      {/* ======================================================== */}
      <section
        className={`
          flex-col h-full bg-stone-100
          ${mobileActiveTab === 'map' ? 'flex flex-1 min-w-0' : 'hidden'}
          ${showRightMap ? 'lg:flex lg:flex-1 lg:min-w-[360px]' : 'lg:hidden'}
        `}
      >
        <TravelMapView
          city={activeCity || '杭州'}
          className="w-full h-full rounded-none border-none shadow-none"
          onToggleCollapse={() => setShowRightMap(false)}
          spots={latestParsedRoute?.spots || []}
        />
      </section>

      {/* 桌面端地图收起后的右侧快捷展开悬浮入口 */}
      {!showRightMap && (
        <button
          aria-label="展开联动大地图"
          className="hidden lg:flex fixed right-3 top-20 z-30 items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200/90 shadow-md hover:shadow-lg text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-all cursor-pointer hover:scale-105"
          onClick={() => setShowRightMap(true)}
          title="展开联动大地图"
          type="button"
        >
          <PanelRightOpen className="h-4 w-4" />
          <span>展开地图</span>
        </button>
      )}

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

      {/* ======================================================== */}
      {/* 5. 优雅二次确认弹窗：单个会话删除与清空全部会话          */}
      {/* ======================================================== */}
      {/* 单个会话删除确认弹窗 */}
      <Dialog
        onOpenChange={(open) => !open && setSessionToDelete(null)}
        open={Boolean(sessionToDelete)}
      >
        <DialogContent className="rounded-3xl border border-stone-200 bg-[#FDFBF7] p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>确认删除该对话？</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 pt-2 leading-relaxed">
              确定要删除「
              <span className="font-semibold text-stone-800">
                {sessionToDelete?.title}
              </span>
              」吗？此操作将永久清除该手账的所有聊天记录与路线规划。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4 flex sm:flex-row flex-col-reverse justify-end">
            <Button
              className="rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold"
              onClick={() => setSessionToDelete(null)}
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-700/20"
              onClick={handleConfirmDeleteSession}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 清空所有会话确认弹窗 */}
      <Dialog onOpenChange={setShowClearAllDialog} open={showClearAllDialog}>
        <DialogContent className="rounded-3xl border border-stone-200 bg-[#FDFBF7] p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-base font-bold text-stone-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
              <span>清空所有历史对话？</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-500 pt-2 leading-relaxed">
              确定清空所有手账历史对话吗（共{' '}
              <span className="font-bold text-stone-800">
                {sessions.length}
              </span>{' '}
              个会话）？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4 flex sm:flex-row flex-col-reverse justify-end">
            <Button
              className="rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-100 text-xs font-bold"
              onClick={() => setShowClearAllDialog(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm shadow-red-700/20"
              onClick={handleConfirmClearAll}
            >
              确认清空全部
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full w-full bg-[#FAF7F0] flex items-center justify-center">
          <div className="text-emerald-800 text-sm font-bold animate-pulse flex items-center gap-2">
            <span>🗺️ 正在唤醒 AI 旅行顾问...</span>
          </div>
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
