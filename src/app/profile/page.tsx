'use client'

/**
 * 个人中心页面
 *
 * 采用结构清晰的 Tab 式工作台设计：
 * - 左侧：旅人档案名片、AI 额度看板、数据总览与快捷导航；
 * - 右侧：分 Tab 管理【我的心愿单】、【我的旅行手账】与【账户与安全】。
 */
import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'
import {
  ArrowRight,
  Bot,
  Calendar,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Heart,
  Key,
  LogOut,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchFavoriteAttractions, unfavoriteAttraction } from '@/api/attractions'
import { changePasswordApi, getProfileApi } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppToast } from '@/hooks/useAppToast'
import { formatFullDateTime } from '@/lib/utils/date'
import { useAuthStore } from '@/stores/auth'
import { useChatHistoryStore } from '@/stores/chatHistory'

type ProfileTab = 'favorites' | 'itineraries' | 'security'

export default function Profile() {
  const router = useRouter()
  const logout = useAuthStore(state => state.logout)
  const user = useAuthStore(state => state.user)

  // 状态管理
  const [activeTab, setActiveTab] = useState<ProfileTab>('favorites')
  const [profile, setProfile] = useState<null | ProfileData>(null)
  const [favorites, setFavorites] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [removingFavoriteIds, setRemovingFavoriteIds] = useState<Set<string>>(() => new Set())
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<{
    confirmPassword?: string
    currentPassword?: string
    newPassword?: string
  }>({})
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  // 获取手账历史
  const sessions = useChatHistoryStore(state => state.sessions)
  const setActiveSessionId = useChatHistoryStore(state => state.setActiveSessionId)
  const deleteSession = useChatHistoryStore(state => state.deleteSession)

  const toast = useAppToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      const [profileResult, favResult] = await Promise.all([
        getProfileApi(),
        fetchFavoriteAttractions(),
      ])
      setProfile(profileResult.profile)
      setFavorites(favResult.items)
    }
    catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        toastRef.current.info('登录已过期，请重新登录')
        logout()
        router.replace('/login')
        return
      }
      setLoadError(err instanceof Error ? err.message : '加载个人资料失败')
    }
    finally {
      setLoading(false)
    }
  }, [logout, router])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handlePasswordChange(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordErrors({})

    const form = event.currentTarget
    const formData = new FormData(form)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setPasswordErrors({ confirmPassword: '两次输入的新密码不一致' })
      return
    }

    setChangingPassword(true)
    try {
      await changePasswordApi(currentPassword, newPassword)
      toast.success('密码修改成功，请重新登录')
      form.reset()
      setTimeout(() => {
        logout()
        router.replace('/login')
      }, 1500)
    }
    catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        toast.info('登录已过期，请重新登录')
        logout()
        router.replace('/login')
        return
      }
      setPasswordErrors({
        currentPassword: err instanceof Error ? err.message : '密码修改失败',
      })
    }
    finally {
      setChangingPassword(false)
    }
  }

  async function handleRemoveFavorite(attractionId: string) {
    setRemovingFavoriteIds(prev => new Set(prev).add(attractionId))
    try {
      await unfavoriteAttraction(attractionId)
      setFavorites(prev => prev.filter(item => item.id !== attractionId))
      toast.success('已取消收藏')
    }
    catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '取消收藏失败')
    }
    finally {
      setRemovingFavoriteIds((prev) => {
        const next = new Set(prev)
        next.delete(attractionId)
        return next
      })
    }
  }

  function handleJumpSession(sessionId: string) {
    setActiveSessionId(sessionId)
    router.push('/chat')
  }

  function handleLogout() {
    setShowLogoutDialog(true)
  }

  async function confirmLogout() {
    setShowLogoutDialog(false)
    await logout()
    router.replace('/')
  }

  const quota = profile?.aiQuota
  const isUnlimited = quota?.limit === -1
  const quotaPercent = isUnlimited ? 0 : quota ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0
  const quotaDanger = !isUnlimited && quotaPercent >= 80
  const displayName = user?.username ?? profile?.username ?? '行者旅伴'

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAF7F0] p-6 lg:p-12">
        <div className="mx-auto max-w-[1360px] space-y-6">
          <Skeleton className="h-12 w-64 rounded-2xl" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-[240px] w-full rounded-3xl" />
              <Skeleton className="h-[160px] w-full rounded-3xl" />
            </div>
            <div className="lg:col-span-8 space-y-4">
              <Skeleton className="h-[60px] w-full rounded-2xl" />
              <Skeleton className="h-[360px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-[#FAF7F0] pb-16">
      {/* 顶部 Hero 区域 */}
      <div className="border-b border-stone-200/80 bg-[#FAF7F0] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-3 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-2">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>TRAVELER WORKSPACE · 旅人工作台</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight">
              个人中心与旅行档案
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500">
              集中管理你的旅行足迹手账、心愿目的地收藏与 AI 顾问使用权益。
            </p>
          </div>

          <Button
            className="rounded-2xl border-stone-200 bg-white text-stone-700 hover:bg-stone-100 font-bold text-xs sm:text-sm px-4 h-10 shadow-2xs cursor-pointer shrink-0"
            onClick={handleLogout}
            variant="outline"
          >
            <LogOut className="h-4 w-4 mr-1 text-stone-500" />
            <span>退出登录</span>
          </Button>
        </div>
      </div>

      {/* 主体工作台：双栏结构 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loadError && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
            <span>{loadError}</span>
            <Button onClick={loadProfile} size="sm" variant="outline">重试</Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* 左侧：旅人名片、足迹数据概览与快捷导航 (4 列)              */}
          {/* ======================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-24">
            {/* 模块 1: 用户名片卡 */}
            <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm">
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 p-6 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/40 shadow-md">
                    <AvatarFallback className="bg-emerald-900 text-2xl font-serif font-black text-white">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        手账行者
                      </span>
                    </div>
                    <h2 className="font-serif text-xl font-extrabold truncate mt-1">{displayName}</h2>
                  </div>
                </div>
              </div>

              {/* 足迹概览 3 宫格 */}
              <div className="grid grid-cols-3 border-b border-stone-100 bg-white p-3 text-center">
                <div className="border-r border-stone-100 py-1">
                  <p className="font-serif text-lg font-black text-emerald-800">{favorites.length}</p>
                  <p className="text-[11px] text-stone-400">心愿收藏</p>
                </div>
                <div className="border-r border-stone-100 py-1">
                  <p className="font-serif text-lg font-black text-emerald-800">{sessions.length}</p>
                  <p className="text-[11px] text-stone-400">规划手账</p>
                </div>
                <div className="py-1">
                  <p className="font-serif text-lg font-black text-emerald-800">{isUnlimited ? '∞' : quota?.remaining ?? 0}</p>
                  <p className="text-[11px] text-stone-400">剩余额度</p>
                </div>
              </div>

              <div className="p-4 bg-[#FDFBF7] flex items-center gap-2 text-xs text-stone-500">
                <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                <span>
                  注册于
                  {' '}
                  {profile?.createdAt ? formatFullDateTime(profile.createdAt) : '2026'}
                </span>
              </div>
            </div>

            {/* 模块 2: AI 额度看板 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-700" />
                  <span>AI 规划师今日权益</span>
                </span>
                <Badge
                  className={`rounded-full text-[10px] font-bold ${
                    isUnlimited || (quota && quota.remaining > 0)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                  variant="outline"
                >
                  {isUnlimited ? '无限畅享' : `${quota?.used} / ${quota?.limit}`}
                </Badge>
              </div>

              {quota && !isUnlimited && (
                <div className="space-y-1.5 pt-1">
                  <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        quotaDanger ? 'bg-red-500' : 'bg-emerald-700'
                      }`}
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone-400">
                    {quota.remaining > 0 ? `今日剩余 ${quota.remaining} 次调用，每日 00:00 自动重置` : '今日额度已达上限，次日自动重置'}
                  </p>
                </div>
              )}
            </div>

            {/* 模块 3: 快捷探索直通车 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-4 shadow-sm space-y-1.5">
              <Link
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs font-bold text-stone-800"
                href="/chat"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-emerald-700" />
                  <span>新建 AI 手账对话</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
              </Link>
              <Link
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs font-bold text-stone-800"
                href="/attractions"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="h-4 w-4 text-emerald-700" />
                  <span>探索精选目的地</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
              </Link>
              <Link
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs font-bold text-stone-800"
                href="/community"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-amber-600" />
                  <span>旅人社区广场</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
              </Link>
            </div>
          </aside>

          {/* ======================================================== */}
          {/* 右侧：清晰 Tab 选项卡内容区 (8 列)                         */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-5">
            {/* Tab 切换栏 */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-200/60 border border-stone-200/80">
              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'favorites'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                onClick={() => setActiveTab('favorites')}
                type="button"
              >
                <Heart className={`w-4 h-4 ${activeTab === 'favorites' ? 'fill-red-500 text-red-500' : ''}`} />
                <span>我的心愿单</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                  {favorites.length}
                </span>
              </button>

              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'itineraries'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                onClick={() => setActiveTab('itineraries')}
                type="button"
              >
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                <span>规划手账历史</span>
                <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-stone-100 text-stone-600">
                  {sessions.length}
                </span>
              </button>

              <button
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'security'
                    ? 'bg-white text-emerald-900 shadow-sm'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                onClick={() => setActiveTab('security')}
                type="button"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>账号与安全</span>
              </button>
            </div>

            {/* ---------------------------------------------------- */}
            {/* Tab 1: 我的心愿单                                    */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'favorites' && (
              <div className="space-y-4 animate-fade-in">
                {/* 心愿一键编排提示卡片 */}
                {favorites.length > 0 && (
                  <div className="rounded-3xl border border-emerald-700/20 bg-gradient-to-r from-emerald-900 via-emerald-950 to-stone-900 text-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <Sparkles className="w-4 h-4" />
                        <span>心愿目的地串联</span>
                      </div>
                      <p className="text-xs text-emerald-100/80 leading-relaxed">
                        已收藏
                        {' '}
                        {favorites.length}
                        {' '}
                        处景点，一键让 AI 为你规划最佳游览顺序与顺路美食！
                      </p>
                    </div>
                    <Link
                      className="rounded-2xl bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black px-4 py-2.5 flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-transform hover:scale-105"
                      href="/chat"
                    >
                      <Bot className="w-4 h-4" />
                      <span>呼唤 AI 编排路线</span>
                    </Link>
                  </div>
                )}

                {/* 收藏景点卡片网格 */}
                <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900">
                      已收藏的目的地
                    </h3>
                    <span className="text-xs text-stone-400">
                      共
                      {' '}
                      {favorites.length}
                      {' '}
                      处
                    </span>
                  </div>

                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favorites.map(item => (
                        <div
                          className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
                          key={item.id}
                        >
                          <div className="relative h-36 w-full overflow-hidden">
                            <Image
                              alt={item.name}
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                              fill
                              src={item.coverImage}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent opacity-60" />
                            <Badge className="absolute left-2.5 top-2.5 bg-white/95 text-[10px] font-bold text-emerald-800 shadow-sm rounded-full">
                              📍
                              {' '}
                              {item.city}
                            </Badge>
                            <button
                              className="absolute right-2.5 top-2.5 p-1.5 rounded-full bg-white/90 text-stone-400 hover:text-red-500 shadow-sm cursor-pointer transition-transform hover:scale-110"
                              disabled={removingFavoriteIds.has(item.id)}
                              onClick={() => handleRemoveFavorite(item.id)}
                              title="取消收藏"
                              type="button"
                            >
                              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                            </button>
                          </div>

                          <div className="p-3.5 flex flex-col justify-between flex-1">
                            <div>
                              <div className="flex items-start justify-between gap-1.5 mb-1.5 min-h-[2.2rem]">
                                <h4
                                  className="font-serif text-sm font-bold text-stone-900 line-clamp-2 leading-snug flex-1 min-w-0"
                                  title={item.name}
                                >
                                  {item.name}
                                </h4>
                                <Badge
                                  className={`rounded-full text-[10px] font-bold shrink-0 whitespace-nowrap mt-0.5 ${
                                    item.ticketType === 'free'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                                  }`}
                                >
                                  {item.ticketType === 'free' ? '免费' : item.priceText || '收费'}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-stone-500 line-clamp-1">{item.summary}</p>
                            </div>

                            <div className="pt-2.5 mt-2 border-t border-stone-100 flex items-center justify-between">
                              <Link
                                className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                                href={`/attractions/${item.id}`}
                              >
                                <span>查看详情</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs text-stone-400 space-y-3">
                      <Compass className="h-10 w-10 mx-auto opacity-30 text-emerald-700" />
                      <p className="text-sm font-bold text-stone-600">你的心愿单还是空的</p>
                      <p className="text-xs text-stone-400">在探索景点时点击红心，将心仪目的地收藏至此</p>
                      <Link
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                        href="/attractions"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>去探索精选景点</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* Tab 2: 规划手账历史                                  */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'itineraries' && (
              <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 shadow-sm space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900">
                      我的 AI 手账规划记录
                    </h3>
                    <p className="text-xs text-stone-400 mt-0.5">所有与 AI 规划师生成的路书与对话</p>
                  </div>
                  <Link
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl hover:bg-emerald-100 transition-colors"
                    href="/chat"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>新建手账</span>
                  </Link>
                </div>

                {sessions.length > 0 ? (
                  <div className="space-y-3">
                    {sessions.map(session => (
                      <div
                        className="p-4 rounded-2xl border border-stone-200/80 bg-white hover:border-emerald-300 hover:shadow-2xs transition-all flex items-center justify-between gap-4 group"
                        key={session.id}
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            {session.city && (
                              <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold rounded-md px-2 py-0.2">
                                📍
                                {' '}
                                {session.city}
                              </Badge>
                            )}
                            <h4 className="font-serif text-sm font-bold text-stone-900 group-hover:text-emerald-800 transition-colors truncate">
                              {session.title || '新的手账对话'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] text-stone-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatFullDateTime(session.updatedAt || session.createdAt)}
                            </span>
                            <span>
                              {session.messages?.length || 0}
                              {' '}
                              条对话消息
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 h-8 cursor-pointer"
                            onClick={() => handleJumpSession(session.id)}
                            size="sm"
                          >
                            继续规划
                          </Button>
                          <button
                            className="p-2 text-stone-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                            onClick={() => deleteSession(session.id)}
                            title="删除会话"
                            type="button"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-stone-400 space-y-3">
                    <MessageSquare className="h-10 w-10 mx-auto opacity-30 text-emerald-700" />
                    <p className="text-sm font-bold text-stone-600">暂无手账规划记录</p>
                    <p className="text-xs text-stone-400">与 AI 规划师开启对话，为你自动生成视觉路书与地图导航</p>
                    <Link
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                      href="/chat"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>开启 AI 对话规划</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* Tab 3: 账号与安全                                    */}
            {/* ---------------------------------------------------- */}
            {activeTab === 'security' && (
              <div className="space-y-5 animate-fade-in">
                {/* 账号基本信息卡 */}
                <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 shadow-sm space-y-3">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-700" />
                    <span>账号基本信息</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                      <span className="text-[11px] text-stone-400 block">旅伴账号</span>
                      <span className="font-bold text-sm text-stone-800">{displayName}</span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-white border border-stone-200/80">
                      <span className="text-[11px] text-stone-400 block">账号角色</span>
                      <span className="font-bold text-sm text-emerald-800">认证旅行者 (Standard)</span>
                    </div>
                  </div>
                </div>

                {/* 修改密码表单 */}
                <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900">修改登录密码</h3>
                  </div>

                  <form className="space-y-4" onSubmit={handlePasswordChange}>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-stone-700" htmlFor="currentPassword">当前密码</Label>
                      <div className="relative">
                        <Input
                          autoComplete="current-password"
                          className="h-10 rounded-xl bg-white border-stone-200 pr-10 text-xs text-stone-900"
                          id="currentPassword"
                          name="currentPassword"
                          placeholder="请输入当前密码"
                          required
                          type={showCurrentPassword ? 'text' : 'password'}
                        />
                        <button
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                          onClick={() => setShowCurrentPassword(v => !v)}
                          type="button"
                        >
                          {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && (
                        <p className="text-[11px] text-red-600">{passwordErrors.currentPassword}</p>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700" htmlFor="newPassword">新密码</Label>
                        <div className="relative">
                          <Input
                            autoComplete="new-password"
                            className="h-10 rounded-xl bg-white border-stone-200 pr-10 text-xs text-stone-900"
                            id="newPassword"
                            minLength={6}
                            name="newPassword"
                            placeholder="至少 6 位新密码"
                            required
                            type={showNewPassword ? 'text' : 'password'}
                          />
                          <button
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                            onClick={() => setShowNewPassword(v => !v)}
                            type="button"
                          >
                            {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-stone-700" htmlFor="confirmPassword">确认新密码</Label>
                        <Input
                          autoComplete="new-password"
                          className="h-10 rounded-xl bg-white border-stone-200 text-xs text-stone-900"
                          id="confirmPassword"
                          name="confirmPassword"
                          placeholder="再次输入新密码"
                          required
                          type="password"
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="text-[11px] text-red-600">{passwordErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <span className="text-[11px] text-stone-400">修改密码成功后需重新登录</span>
                      <Button
                        className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 cursor-pointer"
                        disabled={changingPassword}
                        size="sm"
                        type="submit"
                      >
                        {changingPassword ? '正在更新...' : '确认更新密码'}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 退出登录确认弹窗 */}
      <Dialog onOpenChange={setShowLogoutDialog} open={showLogoutDialog}>
        <DialogContent className="rounded-3xl border border-stone-200 bg-[#FDFBF7] p-6 max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-stone-900">确认退出登录？</DialogTitle>
            <DialogDescription className="text-xs text-stone-500">
              退出后将无法使用个性化 AI 规划与手账收藏功能，您随时可以再次登录。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button
              className="rounded-xl border-stone-200 bg-white text-stone-700"
              onClick={() => setShowLogoutDialog(false)}
              variant="outline"
            >
              取消
            </Button>
            <Button
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
              onClick={confirmLogout}
            >
              退出登录
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
