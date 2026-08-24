'use client'

/**
 * 个人中心页面
 *
 * 采用双栏工作台布局：
 * 左侧展示用户旅行名片、AI 使用额度、快捷直通车与安全设置；
 * 右侧展示我的收藏目的地、修改密码及行程足迹。
 */
import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'
import {
  ArrowRight,
  Bot,
  Clock,
  Compass,
  Eye,
  EyeOff,
  Heart,
  Key,
  LogOut,
  MapPin,
  User,
  Users,
} from 'lucide-react'
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

export default function Profile() {
  const router = useRouter()
  const logout = useAuthStore(state => state.logout)
  const user = useAuthStore(state => state.user)

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
  const displayName = user?.username ?? profile?.username ?? '旅伴'

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
              <Skeleton className="h-[280px] w-full rounded-3xl" />
              <Skeleton className="h-[360px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#FAF7F0] min-h-dvh pb-16">
      {/* 顶部 Hero 区域 */}
      <div className="border-b border-stone-200/80 bg-[#FAF7F0] px-4 sm:px-8 lg:px-12 pb-12 pt-8 sm:pt-10">
        <div className="mx-auto max-w-[1360px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 border border-emerald-300/60 px-3 py-0.5 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-2">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>TRAVELER PROFILE · 旅人档案</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-extrabold text-stone-900 leading-tight">
              个人中心与心愿手账
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-stone-500">
              管理你的专属旅行档案、AI 顾问使用额度与收藏心愿单。
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

      {/* 主体工作台：双栏协同布局 */}
      <div className="mx-auto max-w-[1360px] px-4 sm:px-8 lg:px-12 mt-6">
        {loadError && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
            <span>{loadError}</span>
            <Button onClick={loadProfile} size="sm" variant="outline">重试</Button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* ======================================================== */}
          {/* 左侧旅人名片与额度看板 (4 列)                             */}
          {/* ======================================================== */}
          <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* 用户名片卡 */}
            <div className="overflow-hidden rounded-3xl border border-stone-200/90 bg-[#FDFBF7] shadow-sm">
              <div className="bg-emerald-800 p-6 text-white">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/40 shadow-md">
                    <AvatarFallback className="bg-emerald-950 text-2xl font-serif font-black text-white">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest block">TRAVELER</span>
                    <h2 className="font-serif text-xl font-extrabold">{displayName}</h2>
                  </div>
                </div>
              </div>
              <div className="p-4.5 bg-white/70 border-t border-stone-100 flex items-center gap-2 text-xs text-stone-500">
                <Clock className="h-3.5 w-3.5 text-stone-400" />
                <span>
                  注册于
                  {' '}
                  {profile?.createdAt ? formatFullDateTime(profile.createdAt) : '2026'}
                </span>
              </div>
            </div>

            {/* AI 额度看板 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5 text-emerald-700" />
                  <span>AI 规划师使用额度</span>
                </span>
                <Badge
                  className={`rounded-full text-[10px] font-bold ${
                    isUnlimited || (quota && quota.remaining > 0)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-700 border border-red-200'
                  }`}
                  variant="outline"
                >
                  {isUnlimited ? `${quota?.used} / 无限` : `${quota?.used} / ${quota?.limit}`}
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
                    {quota.remaining > 0 ? `剩余 ${quota.remaining} 次，每日自动刷新重置` : '今日额度已达上限，次日自动重置'}
                  </p>
                </div>
              )}
            </div>

            {/* 快捷探索直通车 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-4 shadow-sm space-y-1.5">
              <Link
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs font-bold text-stone-800"
                href="/chat"
              >
                <div className="flex items-center gap-2.5">
                  <Bot className="h-4 w-4 text-emerald-700" />
                  <span>AI 旅伴对话工作台</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-stone-400" />
              </Link>
              <Link
                className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all text-xs font-bold text-stone-800"
                href="/attractions"
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  <span>精选目的地探索</span>
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
          {/* 右侧我的心愿收藏与安全设置 (8 列)                         */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 space-y-6">
            {/* 我的收藏景点清单 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm sm:text-base font-bold text-stone-900 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                  <span>我的心愿目的地收藏</span>
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  共
                  {' '}
                  {favorites.length}
                  {' '}
                  处
                </span>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favorites.map(item => (
                    <div
                      className="group flex items-center justify-between p-3.5 rounded-2xl border border-stone-200/80 bg-white hover:border-emerald-300 hover:shadow-2xs transition-all"
                      key={item.id}
                    >
                      <Link className="min-w-0 flex-1 flex items-center gap-3" href={`/attractions/${item.id}`}>
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 shrink-0 font-bold">
                          📍
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-900 group-hover:text-emerald-800 truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-stone-400 truncate">
                            {item.city}
                            {' '}
                            ·
                            {' '}
                            {item.ticketType === 'free' ? '免费' : item.priceText || '收费'}
                          </p>
                        </div>
                      </Link>

                      <button
                        className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                        disabled={removingFavoriteIds.has(item.id)}
                        onClick={() => handleRemoveFavorite(item.id)}
                        title="取消收藏"
                        type="button"
                      >
                        <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-stone-400 space-y-2">
                  <Compass className="h-8 w-8 mx-auto opacity-40 text-emerald-700" />
                  <p>暂无收藏的景点，去「精选景点」探索心动目的地吧</p>
                  <Link className="inline-block text-xs font-bold text-emerald-800 hover:underline" href="/attractions">
                    前往浏览精选景点 ➔
                  </Link>
                </div>
              )}
            </div>

            {/* 安全设置：修改密码 */}
            <div className="rounded-3xl border border-stone-200/90 bg-[#FDFBF7] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-emerald-700" />
                <h3 className="font-serif text-sm sm:text-base font-bold text-stone-900">账户安全与修改密码</h3>
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
                        placeholder="至少 6 位密码"
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
                      placeholder="再次确认新密码"
                      required
                      type="password"
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-[11px] text-red-600">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                  <span className="text-[11px] text-stone-400">修改密码后需重新登录验证</span>
                  <Button
                    className="rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 cursor-pointer"
                    disabled={changingPassword}
                    size="sm"
                    type="submit"
                  >
                    {changingPassword ? '正在修改...' : '确认修改密码'}
                  </Button>
                </div>
              </form>
            </div>
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
    </main>
  )
}
