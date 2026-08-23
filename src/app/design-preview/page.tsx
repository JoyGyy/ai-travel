'use client'

import {
  ArrowRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  Compass,
  DollarSign,
  Eye,
  Heart,
  Layers,
  MapPin,
  Palette,
  Send,
  Sliders,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import React, { useState } from 'react'

type ThemeKey = 'resort' | 'tech' | 'nature'

export default function DesignPreviewPage() {
  const [activeTheme, setActiveTheme] = useState<ThemeKey>('resort')

  return (
    <div className="min-h-screen pb-24 transition-colors duration-500 font-sans" style={getThemeContainerStyle(activeTheme)}>
      {/* 顶部固定切换控制器 */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 shadow-sm transition-all duration-300" style={getThemeNavStyle(activeTheme)}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl text-white shadow-md flex items-center justify-center font-bold" style={getThemeAccentBg(activeTheme)}>
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base md:text-lg flex items-center gap-2">
                UI 重构方案实时交互预览
                <span className="text-xs px-2 py-0.5 rounded-full font-normal border" style={getThemeBadgeStyle(activeTheme)}>
                  实时可交互
                </span>
              </h1>
              <p className="text-xs opacity-70">点击右侧按钮可实时切换整套视觉设计语言与组件库风格</p>
            </div>
          </div>

          {/* 方案切换 Tabs */}
          <div className="flex items-center p-1 rounded-2xl border shadow-inner max-w-full overflow-x-auto" style={getThemeTabContainerStyle(activeTheme)}>
            <button
              onClick={() => setActiveTheme('resort')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTheme === 'resort'
                  ? 'bg-white text-sky-700 shadow-md scale-[1.02]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span>🏖️</span>
              <span>方案一：现代极简度假</span>
            </button>
            <button
              onClick={() => setActiveTheme('tech')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTheme === 'tech'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span>⚡</span>
              <span>方案二：AI 智能科技</span>
            </button>
            <button
              onClick={() => setActiveTheme('nature')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                activeTheme === 'nature'
                  ? 'bg-emerald-700 text-white shadow-md scale-[1.02]'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <span>🌿</span>
              <span>方案三：清新自然探索</span>
            </button>
          </div>
        </div>
      </header>

      {/* 方案核心设计理念说明 Banner */}
      <section className="max-w-7xl mx-auto px-4 pt-8 pb-4">
        <ThemeDescriptionBanner theme={activeTheme} />
      </section>

      {/* 核心组件模块展示 */}
      <main className="max-w-7xl mx-auto px-4 space-y-12 mt-4">
        {/* 1. 顶部导航栏预览 */}
        <section className="space-y-3">
          <SectionHeader
            title="1. 顶部导航栏 (Global Navigation)"
            desc="悬浮毛玻璃、品牌 Logo、极简激活胶囊态与用户状态"
            theme={activeTheme}
          />
          <MockNavigation theme={activeTheme} />
        </section>

        {/* 2. Hero 搜索区与视觉焦点 */}
        <section className="space-y-3">
          <SectionHeader
            title="2. 首页 Hero 与智能搜索交互 (Hero & Search Hub)"
            desc="高光标题、胶囊型搜索卡片、智能日期与预算选择器"
            theme={activeTheme}
          />
          <MockHeroSearch theme={activeTheme} />
        </section>

        {/* 3. AI 对话与思考流式卡片 */}
        <section className="space-y-3">
          <SectionHeader
            title="3. AI 行程助手与多轮对话 (Conversational AI Flow)"
            desc="思维链折叠折叠、动态流光、工具调用步骤（天气/景点检索）、结构化回答卡片"
            theme={activeTheme}
          />
          <MockChatSection theme={activeTheme} />
        </section>

        {/* 4. 目的地推荐与 Bento Grid 卡片 */}
        <section className="space-y-3">
          <SectionHeader
            title="4. 热门目的地与探索卡片 (Bento Grid & Destination Cards)"
            desc="大图沉浸质感、微距毛玻璃标签、悬停微动效与评分徽章"
            theme={activeTheme}
          />
          <MockDestinationGrid theme={activeTheme} />
        </section>

        {/* 5. 行程时间轴规划卡片 */}
        <section className="space-y-3">
          <SectionHeader
            title="5. 智能行程详情与时间轴 (Itinerary Timeline & Budget)"
            desc="每日行程节点、住宿推荐卡片、预算可视化进度条"
            theme={activeTheme}
          />
          <MockItineraryDetail theme={activeTheme} />
        </section>
      </main>
    </div>
  )
}

/* ========================================================================= */
/*                              子组件与样式模拟                             */
/* ========================================================================= */

function SectionHeader({ title, desc, theme }: { title: string, desc: string, theme: ThemeKey }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b pb-2" style={{ borderColor: theme === 'tech' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}>
      <h2 className="text-lg md:text-xl font-bold tracking-tight flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={getThemeAccentBg(theme)} />
        {title}
      </h2>
      <span className="text-xs opacity-60 mt-1 sm:mt-0">{desc}</span>
    </div>
  )
}

function ThemeDescriptionBanner({ theme }: { theme: ThemeKey }) {
  if (theme === 'resort') {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-rose-500/10 border border-sky-500/20 text-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-600 text-white">方案一</span>
            <h3 className="font-bold text-lg text-slate-900">现代极简度假风（Airbnb / Apple 质感）</h3>
          </div>
          <p className="text-sm text-slate-600">
            采用纯白高透底色搭配
            <strong>海天湛蓝 (#0284C7)</strong>
            与
            <strong>日落珊瑚橙 (#F43F5E)</strong>
            ，辅以 24px 大圆角与柔和漫反射微阴影，营造阳光、轻快、高质感的度假氛围。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-sky-200 text-sky-800 font-medium">✨ 极简纯净</span>
          <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-rose-200 text-rose-800 font-medium">🌅 阳光微彩</span>
          <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-slate-200 text-slate-700 font-medium">🫧 晶莹毛玻璃</span>
        </div>
      </div>
    )
  }

  if (theme === 'tech') {
    return (
      <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-violet-950/40 border border-cyan-500/30 text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-cyan-950/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-400 text-slate-950">方案二</span>
            <h3 className="font-bold text-lg text-cyan-300">新一代 AI 智能科技风（Perplexity / Linear 质感）</h3>
          </div>
          <p className="text-sm text-slate-400">
            采用深空黑曜石底色与
            <strong>极光青 (#06B6D4)</strong>
            、
            <strong>量子紫 (#8B5CF6)</strong>
            渐变微光，1px 精致流光边框与高效的信息密度，极具前沿 AI Agent 科技感。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 font-medium">⚡ 极光发光</span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-medium">🔮 极客深邃</span>
          <span className="px-3 py-1.5 rounded-xl bg-violet-950/50 border border-violet-500/40 text-violet-300 font-medium">🤖 Agent 动效</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600/10 via-amber-500/5 to-teal-600/10 border border-emerald-600/20 text-stone-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-700 text-white">方案三</span>
          <h3 className="font-bold text-lg text-stone-900">清新自然探索风（小红书 / 旅游杂志风）</h3>
        </div>
        <p className="text-sm text-stone-600">
          采用温润奶沙色背景搭配
          <strong>森林翡翠绿 (#059669)</strong>
          与
          <strong>暖金沙色 (#D97706)</strong>
          ，搭配精致的大图排版与手账便签式模块，充满自然人文探索的舒适感。
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-emerald-200 text-emerald-800 font-medium">🌿 自然生机</span>
        <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-amber-200 text-amber-800 font-medium">🏕️ 户外手账</span>
        <span className="px-3 py-1.5 rounded-xl bg-white/80 border border-stone-200 text-stone-700 font-medium">📖 杂志美感</span>
      </div>
    </div>
  )
}

/* 1. 模拟导航栏 */
function MockNavigation({ theme }: { theme: ThemeKey }) {
  if (theme === 'resort') {
    return (
      <div className="w-full rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200/80 p-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-base tracking-wider text-slate-900">
            TRAVEL
            <span className="text-sky-600">.AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/50">
          <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-white text-sky-600 shadow-sm">首页</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900">AI 行程规划</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900">景点探索</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900">旅友社区</button>
          <button className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 hover:text-slate-900">实时天气</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-600/20 hover:opacity-95">
            <Sparkles className="w-3.5 h-3.5" />
            <span>智能规划</span>
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
            JP
          </div>
        </div>
      </div>
    )
  }

  if (theme === 'tech') {
    return (
      <div className="w-full rounded-2xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/20 p-3 shadow-lg shadow-black/40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/10">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-mono font-bold text-base tracking-widest text-white">
            TRAVEL
            <span className="text-cyan-400">://AGENT</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-500/40">~/home</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200">~/itinerary</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200">~/attractions</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200">~/community</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-slate-200">~/weather</button>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-400 text-slate-950 shadow-md shadow-cyan-400/20 hover:bg-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI CORE 3.7</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl bg-[#fbf8f2] border border-stone-300/70 p-3 shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md">
          <Compass className="w-5 h-5" />
        </div>
        <span className="font-serif font-bold text-lg tracking-tight text-stone-900">
          远方
          {' '}
          <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Travel Log</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <button className="text-sm font-bold text-emerald-800 border-b-2 border-emerald-700 pb-0.5">探索首页</button>
        <button className="text-sm font-medium text-stone-600 hover:text-stone-900">旅行手账</button>
        <button className="text-sm font-medium text-stone-600 hover:text-stone-900">宝藏景点</button>
        <button className="text-sm font-medium text-stone-600 hover:text-stone-900">旅人日志</button>
        <button className="text-sm font-medium text-stone-600 hover:text-stone-900">出行天气</button>
      </div>

      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-emerald-700 text-white shadow hover:bg-emerald-800">
          <span>定制我的旅程</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

/* 2. 模拟 Hero 搜索栏 */
function MockHeroSearch({ theme }: { theme: ThemeKey }) {
  if (theme === 'resort') {
    return (
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 bg-gradient-to-br from-sky-100/80 via-white to-blue-50 border border-slate-200/60 shadow-lg text-slate-900">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>新一代 AI 旅行引擎 · 秒级生成高品质路书</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            出发吧，去探索世界的美好
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            输入目的地与预算，AI 自动权衡天气、路线、打卡点与舒适住宿
          </p>
        </div>

        {/* 现代极简胶囊搜索栏 (Airbnb 风格) */}
        <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-lg p-2.5 rounded-full border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col md:flex-row items-center divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-2">
          {/* 目的地 */}
          <div className="flex-1 px-5 py-2 w-full flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-full transition-colors">
            <MapPin className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">目的地</div>
              <div className="text-sm font-semibold text-slate-800">三亚 · 海棠湾</div>
            </div>
          </div>

          {/* 出行日期 */}
          <div className="flex-1 px-5 py-2 w-full flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-full transition-colors">
            <Calendar className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">行程日期</div>
              <div className="text-sm font-semibold text-slate-800">4月12日 - 4月15日 (4天)</div>
            </div>
          </div>

          {/* 预算设置 */}
          <div className="flex-1 px-5 py-2 w-full flex items-center gap-3 cursor-pointer hover:bg-slate-50 rounded-full transition-colors">
            <DollarSign className="w-5 h-5 text-sky-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">预算偏好</div>
              <div className="text-sm font-semibold text-slate-800">¥ 4,500 / 舒适享受</div>
            </div>
          </div>

          {/* 搜索按钮 */}
          <div className="p-1 w-full md:w-auto">
            <button className="w-full md:w-auto px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 hover:shadow-xl transition-all cursor-pointer">
              <Sparkles className="w-4 h-4" />
              <span>AI 生成行程</span>
            </button>
          </div>
        </div>

        {/* 热门快捷标签 */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-slate-500">
          <span className="font-semibold">热门推荐：</span>
          {['洱海环湖慢游', '西安盛唐深度游', '川西甘孜自驾', '厦门文艺小资'].map(tag => (
            <span key={tag} className="px-3 py-1 rounded-full bg-white/80 border border-slate-200 hover:border-sky-400 hover:text-sky-600 cursor-pointer transition-colors shadow-2xs">
              🔥
              {' '}
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (theme === 'tech') {
    return (
      <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 bg-slate-900 border border-cyan-500/30 shadow-2xl text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-900 to-black pointer-events-none" />

        <div className="relative z-1 max-w-2xl mx-auto text-center space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-400 text-xs font-mono">
            <Bot className="w-3.5 h-3.5 animate-spin" />
            <span>AUTONOMOUS TRAVEL AGENT v2.0</span>
          </div>
          <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-white font-sans">
            输入任何想法，
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400">大模型即刻推演</span>
          </h2>
          <p className="text-sm md:text-base text-slate-400 font-mono">
            融合高精度实时气象、本地知识库 RAG 与动态约束求解
          </p>
        </div>

        {/* 科技风指令输入框 */}
        <div className="relative z-1 max-w-3xl mx-auto bg-slate-950/80 backdrop-blur-xl p-3 rounded-2xl border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 w-full">
            <span className="text-cyan-400 font-mono text-sm font-bold">&gt;</span>
            <input
              type="text"
              readOnly
              value="五一假期带父母去成都4天3晚，预算5000，喜欢慢节奏喝茶看大熊猫"
              className="bg-transparent border-none outline-none text-sm text-slate-200 w-full font-sans"
            />
          </div>
          <button className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 cursor-pointer">
            <Sparkles className="w-4 h-4" />
            <span>EXECUTE AGENT</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-3xl overflow-hidden p-8 md:p-12 bg-[#f4eee1] border border-stone-300 shadow-md text-stone-900">
      <div className="max-w-2xl mx-auto text-center space-y-3 mb-8">
        <span className="font-serif italic text-amber-800 text-sm tracking-widest">— 每一场旅行，都是生命的一首诗 —</span>
        <h2 className="text-2xl md:text-4xl font-serif font-black tracking-tight text-stone-900">
          定制属于你的独家旅行手账
        </h2>
        <p className="text-sm text-stone-600 font-sans">
          寻找山野间的宁静，或是古城巷弄里的烟火气
        </p>
      </div>

      <div className="max-w-3xl mx-auto bg-[#fdfbf7] p-4 rounded-2xl border-2 border-stone-300/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full px-3 py-1">
          <div className="text-xs font-bold text-stone-500">你想去探索哪里？</div>
          <div className="text-sm font-bold text-stone-800 mt-0.5">云南 · 大理与丽江古镇</div>
        </div>
        <div className="flex-1 w-full px-3 py-1 border-t md:border-t-0 md:border-l border-stone-200">
          <div className="text-xs font-bold text-stone-500">出行安排</div>
          <div className="text-sm font-bold text-stone-800 mt-0.5">5天4晚 · 深度慢游</div>
        </div>
        <button className="w-full md:w-auto px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow cursor-pointer">
          开启手账生成
        </button>
      </div>
    </div>
  )
}

/* 3. 模拟 AI 对话与思考流 */
function MockChatSection({ theme }: { theme: ThemeKey }) {
  if (theme === 'resort') {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 shadow-md p-6 space-y-4">
        {/* 用户提问 */}
        <div className="flex justify-end">
          <div className="max-w-lg bg-sky-600 text-white p-3.5 rounded-2xl rounded-tr-xs text-sm shadow-md shadow-sky-600/10">
            帮我规划三亚4天3晚行程，第一天下午到，想看日落，带老人小孩，不要太赶。
          </div>
        </div>

        {/* AI 回答 */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0">
            <Bot className="w-5 h-5" />
          </div>

          <div className="space-y-3 flex-1 max-w-2xl">
            {/* AI 思考步骤 (折叠式) */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/70 p-3 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-700">
                <span className="flex items-center gap-1.5 text-sky-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  已完成推理与工具调用 (耗时 1.2s)
                </span>
                <span className="text-[10px] text-slate-400">展开详情</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                  <CloudSun className="w-3 h-3 text-amber-500" />
                  三亚实时天气：28℃ 晴朗无雨
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-500" />
                  已检索海棠湾、椰梦长廊景点库
                </span>
              </div>
            </div>

            {/* AI 回答正文 */}
            <div className="rounded-2xl rounded-tl-xs bg-slate-100/70 border border-slate-200/50 p-4 text-sm text-slate-800 leading-relaxed space-y-2">
              <p className="font-bold text-slate-900">没问题！为你定制了一套适合全家老小的轻松度假路书：</p>
              <p>
                <strong>🌅 Day 1 下午：</strong>
                {' '}
                落地三亚凤凰机场后，专车前往三亚湾酒店办理入住。傍晚带老人孩子漫步
                <strong>椰梦长廊</strong>
                ，欣赏三亚最壮美的落日晚霞。
              </p>
              <p>
                <strong>🐠 Day 2 全天：</strong>
                {' '}
                上午游览
                <strong>亚特兰蒂斯水世界/水族馆</strong>
                （室内恒温无暴晒），下午体验海棠湾免税城闲适购物。
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (theme === 'tech') {
    return (
      <div className="rounded-3xl bg-slate-950 border border-cyan-500/30 shadow-2xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-cyan-500 text-cyan-400 flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>

          <div className="space-y-3 flex-1 max-w-2xl">
            {/* 科技风思维链发光卡片 */}
            <div className="rounded-xl bg-slate-900/90 border border-cyan-500/40 p-3 font-mono text-xs text-cyan-300 space-y-1 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <div className="flex items-center justify-between text-cyan-400 font-bold">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  THOUGHT STREAM // STEP 3 OF 3 COMPLETE
                </span>
                <span className="text-[10px] text-slate-500">420ms</span>
              </div>
              <div className="text-slate-400 text-[11px] font-mono">
                [CALL] Tool.WeatherQuery(city=&quot;Sanya&quot;) -&gt; OK 28C
                <br />
                [RAG] EmbeddingSearch(k=5, sim_score=0.92) -&gt; 5 nodes retrieved
              </div>
            </div>

            <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-200 leading-relaxed font-sans">
              <p className="text-cyan-300 font-mono text-xs mb-2"># ITINERARY_SYNTHESIS_RESULT</p>
              <p className="text-slate-300">
                已根据低疲劳度与全家适宜度权重，为你生成三亚慢节奏方案：Day 1 椰梦长廊日落，Day 2 亚特兰蒂斯生态观光。
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-[#fdfbf7] border-2 border-stone-300 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-800 text-white flex items-center justify-center shrink-0">
          <Compass className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
            <span>📌 顾问手记：已查阅三亚4月气象与老人无障碍通行指南</span>
          </div>
          <div className="p-4 bg-white rounded-xl border border-stone-200 text-sm text-stone-800 leading-relaxed">
            <p className="font-serif font-bold text-stone-900 text-base mb-1">给全家人的三亚慢调慢游：</p>
            <p>第一天傍晚吹吹椰林海风，第二天悠闲漫步水族馆，不赶路，只享受相聚时光。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* 4. 模拟目的地卡片 Bento Grid */
function MockDestinationGrid({ theme }: { theme: ThemeKey }) {
  const cards = [
    { title: '三亚 · 蔚蓝海棠湾', tag: '海岛度假', score: '4.9', price: '¥ 2,800起', color: 'from-blue-600 to-cyan-500' },
    { title: '大理 · 苍山洱海慢生活', tag: '浪漫小资', score: '4.8', price: '¥ 1,900起', color: 'from-teal-600 to-emerald-500' },
    { title: '西安 · 大唐不夜城', tag: '历史古韵', score: '4.9', price: '¥ 1,500起', color: 'from-amber-600 to-rose-500' },
  ]

  if (theme === 'resort') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="group rounded-3xl bg-white border border-slate-200/80 p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
            <div className={`h-44 rounded-2xl bg-gradient-to-tr ${c.color} p-4 flex flex-col justify-between text-white relative overflow-hidden`}>
              <div className="flex items-center justify-between z-1">
                <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">{c.tag}</span>
                <span className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </span>
              </div>
              <div className="z-1">
                <div className="text-xs opacity-80">HOT DESTINATION</div>
                <div className="font-bold text-lg">{c.title}</div>
              </div>
            </div>
            <div className="pt-3 flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{c.score}</span>
                <span className="text-slate-400 font-normal">(1.2k+ 条评价)</span>
              </div>
              <span className="text-sm font-extrabold text-sky-600">{c.price}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (theme === 'tech') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl bg-slate-900 border border-cyan-500/30 p-4 hover:border-cyan-400 transition-all duration-300 cursor-pointer">
            <div className="h-40 rounded-xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between text-cyan-300 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 font-bold">{c.tag}</span>
                <span>
                  NODE://
                  {i + 1}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-sans">TARGET_GEO</div>
                <div className="font-bold text-base text-white font-sans">{c.title}</div>
              </div>
            </div>
            <div className="pt-3 flex items-center justify-between font-mono text-xs">
              <span className="text-emerald-400">
                SCORE:
                {c.score}
              </span>
              <span className="text-cyan-400 font-bold">{c.price}</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c, i) => (
        <div key={i} className="rounded-2xl bg-[#fdfbf7] border-2 border-stone-300 p-4 shadow-sm hover:border-emerald-700 transition-colors cursor-pointer">
          <div className="h-40 rounded-xl bg-stone-200 p-4 flex flex-col justify-between text-stone-900 border border-stone-300">
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-xs font-serif font-bold w-max">{c.tag}</span>
            <div className="font-serif font-bold text-lg">{c.title}</div>
          </div>
          <div className="pt-3 flex items-center justify-between text-xs">
            <span className="text-amber-700 font-serif font-bold">
              ★
              {c.score}
              {' '}
              旅人热荐
            </span>
            <span className="font-bold text-emerald-800 text-sm">{c.price}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* 5. 模拟行程时间轴与预算明细 */
function MockItineraryDetail({ theme }: { theme: ThemeKey }) {
  if (theme === 'resort') {
    return (
      <div className="rounded-3xl bg-white border border-slate-200/80 p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900">4天3晚深度放松之旅 · 行程总览</h3>
            <p className="text-xs text-slate-500 mt-0.5">总预算 ¥4,500 · 预估支出 ¥3,980 · 结余 ¥520</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">预算充足</span>
            <button className="px-4 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 cursor-pointer">导出 PDF</button>
          </div>
        </div>

        {/* 时间轴节点 */}
        <div className="space-y-4 pl-4 border-l-2 border-sky-200 ml-2">
          <div className="relative">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-sky-600 border-2 border-white shadow" />
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Day 1：初见海岛 · 椰梦落日</span>
                <span className="text-xs font-semibold text-sky-600">建议用时 4 小时</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                15:00 抵达三亚湾酒店办理入住 -&gt; 17:30 椰梦长廊观落日拍写真 -&gt; 19:30 第一市场海鲜晚餐
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-400 border-2 border-white shadow" />
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Day 2：梦幻水底世界与免税潮购</span>
                <span className="text-xs font-semibold text-sky-600">建议用时 全天</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                09:30 亚特兰蒂斯失落的空间水族馆 -&gt; 14:00 cdf 三亚国际免税城体验
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (theme === 'tech') {
    return (
      <div className="rounded-3xl bg-slate-950 border border-cyan-500/30 p-6 space-y-4 text-slate-200">
        <div className="flex justify-between items-center border-b border-cyan-500/20 pb-3 font-mono text-xs">
          <span className="text-cyan-400 font-bold">ROUTE_MAP::GEN_ID_8832</span>
          <span className="text-emerald-400">STATUS: OPTIMIZED (0.02s)</span>
        </div>
        <div className="space-y-3 font-mono text-xs">
          <div className="p-3 bg-slate-900 border border-cyan-500/20 rounded-xl">
            <span className="text-cyan-300 font-bold">[DAY 01]</span>
            {' '}
            ARRIVE -&gt; CHECK-IN -&gt; SUNSET PHOTOGRAPHY
          </div>
          <div className="p-3 bg-slate-900 border border-cyan-500/20 rounded-xl">
            <span className="text-cyan-300 font-bold">[DAY 02]</span>
            {' '}
            ATLANTIS AQUARIUM -&gt; DUTY FREE MALL
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-[#fdfbf7] border-2 border-stone-300 p-6 space-y-4">
      <div className="border-b border-stone-200 pb-3">
        <h3 className="font-serif font-bold text-lg text-stone-900">手账日程 · 慢游慢品</h3>
      </div>
      <div className="space-y-3 font-sans text-sm text-stone-700">
        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
          <div className="font-serif font-bold text-stone-900">第一天 · 橘子色的海边落日</div>
          <div className="text-xs text-stone-600 mt-1">微风不燥，散步于椰树斜影之间，记录第一抹黄昏</div>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================= */
/*                              样式辅助工具函数                             */
/* ========================================================================= */

function getThemeContainerStyle(theme: ThemeKey): React.CSSProperties {
  if (theme === 'resort') {
    return {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
    }
  }
  if (theme === 'tech') {
    return {
      backgroundColor: '#030712',
      color: '#f8fafc',
    }
  }
  return {
    backgroundColor: '#f6f1e7',
    color: '#1c1917',
  }
}

function getThemeNavStyle(theme: ThemeKey): React.CSSProperties {
  if (theme === 'resort') {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
      borderColor: 'rgba(226, 232, 240, 0.8)',
    }
  }
  if (theme === 'tech') {
    return {
      backgroundColor: 'rgba(3, 7, 18, 0.85)',
      borderColor: 'rgba(6, 182, 212, 0.2)',
    }
  }
  return {
    backgroundColor: 'rgba(251, 248, 242, 0.9)',
    borderColor: 'rgba(214, 211, 209, 0.8)',
  }
}

function getThemeAccentBg(theme: ThemeKey): React.CSSProperties {
  if (theme === 'resort') {
    return { background: 'linear-gradient(135deg, #0284c7, #06b6d4)' }
  }
  if (theme === 'tech') {
    return { background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)' }
  }
  return { background: '#047857' }
}

function getThemeBadgeStyle(theme: ThemeKey): React.CSSProperties {
  if (theme === 'resort') {
    return { backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }
  }
  if (theme === 'tech') {
    return { backgroundColor: '#083344', color: '#67e8f9', borderColor: '#164e63' }
  }
  return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }
}

function getThemeTabContainerStyle(theme: ThemeKey): React.CSSProperties {
  if (theme === 'resort') {
    return { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }
  }
  if (theme === 'tech') {
    return { backgroundColor: '#0f172a', borderColor: 'rgba(6, 182, 212, 0.3)' }
  }
  return { backgroundColor: '#ebe3d5', borderColor: '#d6cbb8' }
}
