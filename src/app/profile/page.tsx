'use client'

/**
 * 个人中心页面
 *
 * 展示用户信息、AI 使用额度、修改密码表单、
 * 收藏景点列表，支持取消收藏和退出登录。
 */
import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'
import { Bot, Clock, Cloud, Eye, EyeOff, Heart, Key, LogOut, MapPin, Users } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchFavoriteAttractions, unfavoriteAttraction } from '@/api/attractions'
import { changePasswordApi, getProfileApi } from '@/api/auth'
import { ApiError } from '@/api/client'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPasswordErrors({})

    const formData = new FormData(event.currentTarget)
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
      event.currentTarget.reset()
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

  function confirmLogout() {
    setShowLogoutDialog(false)
    logout()
    router.replace('/')
  }

  const quota = profile?.aiQuota
  const quotaPercent = quota ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0
  const quotaDanger = quotaPercent >= 80
  const displayName = user?.username ?? profile?.username ?? '用户'

  // 加载中骨架屏
  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <div className="travel-container py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <Skeleton className="h-[200px] w-full rounded-2xl" />
              <Skeleton className="h-[120px] w-full rounded-2xl" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-[300px] w-full rounded-2xl" />
              <Skeleton className="h-[400px] w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Hero 区域 */}
      <div className="bg-teal-50/60">
        <div className="travel-container py-12">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-500">
                PROFILE
              </p>
              <h1 className="text-3xl font-black tracking-tight text-gray-900 lg:text-4xl">
                个人中心
              </h1>
              <p className="mt-2 text-gray-500">
                管理你的账户信息、AI 额度和目的地收藏
              </p>
            </div>
            <Button
              className="gap-2"
              onClick={handleLogout}
              variant="outline"
            >
              <LogOut size={16} />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      <div className="travel-container py-8">
        {loadError
          ? (
              <Card className="mb-6 border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <h2 className="mb-2 text-lg font-bold text-red-700">个人资料加载失败</h2>
                  <p className="mb-4 text-red-600">{loadError}</p>
                  <Button onClick={loadProfile} variant="outline">重试</Button>
                </CardContent>
              </Card>
            )
          : null}

        <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
          {/* 左侧 - 用户信息 */}
          <div className="space-y-6">
            {/* 用户卡片 */}
            <Card className="overflow-hidden border-white/60 bg-white/80 backdrop-blur-sm">
              <div className="bg-teal-500 p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 border-4 border-white/20">
                    <AvatarFallback className="bg-white/20 text-3xl font-bold text-white backdrop-blur-sm">
                      {displayName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white">
                    <p className="text-sm opacity-80">当前旅伴</p>
                    <h2 className="text-2xl font-bold">{displayName}</h2>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>
                    {'注册于 '}
                    {profile?.createdAt ? formatFullDateTime(profile.createdAt) : '未知'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* AI 额度卡片 */}
            <Card className="border-white/60 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot size={18} className="text-blue-500" />
                  AI 使用额度
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quota
                  ? (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm text-gray-500">今日已使用</span>
                          <Badge
                            className={quota.remaining > 0
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'}
                            variant="outline"
                          >
                            {quota.used}
                            {' / '}
                            {quota.limit}
                          </Badge>
                        </div>
                        <div
                          aria-label={`AI 额度已使用 ${quota.used} 次，共 ${quota.limit} 次`}
                          aria-valuemax={100}
                          aria-valuemin={0}
                          aria-valuenow={quotaPercent}
                          className="h-2.5 w-full rounded-full bg-gray-100"
                          role="progressbar"
                        >
                          <div
                            className={`h-full rounded-full transition-all ${quotaDanger ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                            style={{ width: `${quotaPercent}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-400">
                          {quota.remaining > 0
                            ? `剩余 ${quota.remaining} 次，每日重置`
                            : '今日额度已用完，明天重置'}
                        </p>
                      </div>
                    )
                  : (
                      <p className="text-center text-sm text-gray-400">无法获取额度信息</p>
                    )}
              </CardContent>
            </Card>

            {/* 快捷操作 */}
            <Card className="border-white/60 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4 space-y-2">
                <Link
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  href="/attractions"
                >
                  <MapPin size={16} className="text-blue-500" />
                  浏览景点
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  href="/community"
                >
                  <Users size={16} className="text-green-500" />
                  旅友社区
                </Link>
                <Link
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  href="/weather"
                >
                  <Cloud size={16} className="text-cyan-500" />
                  天气查询
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* 右侧 - 内容区 */}
          <div className="space-y-6">
            {/* 修改密码 */}
            <Card className="border-white/60 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key size={20} className="text-cyan-500" />
                  修改密码
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handlePasswordChange}>
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">当前密码</Label>
                    <div className="relative">
                      <Input
                        autoComplete="current-password"
                        className="pr-10"
                        id="currentPassword"
                        name="currentPassword"
                        placeholder="请输入当前密码"
                        required
                        type={showCurrentPassword ? 'text' : 'password'}
                      />
                      <Button
                        aria-label={showCurrentPassword ? '隐藏当前密码' : '显示当前密码'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowCurrentPassword(v => !v)}
                        size="icon"
                        tabIndex={-1}
                        type="button"
                        variant="ghost"
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </Button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500" role="alert">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">新密码</Label>
                      <div className="relative">
                        <Input
                          autoComplete="new-password"
                          className="pr-10"
                          id="newPassword"
                          minLength={6}
                          name="newPassword"
                          placeholder="至少 6 位"
                          required
                          type={showNewPassword ? 'text' : 'password'}
                        />
                        <Button
                          aria-label={showNewPassword ? '隐藏新密码' : '显示新密码'}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNewPassword(v => !v)}
                          size="icon"
                          tabIndex={-1}
                          type="button"
                          variant="ghost"
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">确认新密码</Label>
                      <Input
                        autoComplete="new-password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="再次输入新密码"
                        required
                        type="password"
                      />
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs text-red-500" role="alert">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400">修改密码后需要重新登录</p>
                    <Button disabled={changingPassword} type="submit">
                      {changingPassword ? '正在修改...' : '修改密码'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* 我的收藏 */}
            <Card className="border-white/60 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart size={20} className="text-red-500" />
                  我的收藏
                  <Badge className="ml-2" variant="secondary">{favorites.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {favorites.length > 0
                  ? (
                      <div className="space-y-3">
                        {favorites.map(item => (
                          <div
                            className="flex items-center justify-between rounded-xl border border-gray-100 p-4 transition-all hover:border-gray-200 hover:shadow-sm"
                            key={item.id}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-600">
                                <MapPin size={18} />
                              </div>
                              <div>
                                <Link
                                  className="font-semibold text-gray-900 hover:text-primary"
                                  href={`/attractions/${item.id}`}
                                >
                                  {item.name}
                                </Link>
                                <div className="mt-1 flex gap-1.5">
                                  {item.city && (
                                    <Badge className="text-[10px]" variant="secondary">{item.city}</Badge>
                                  )}
                                  {item.ticketType === 'free'
                                    ? (
                                        <Badge className="bg-green-50 text-green-600 border-green-200 text-[10px]" variant="outline">
                                          免费
                                        </Badge>
                                      )
                                    : null}
                                </div>
                              </div>
                            </div>
                            <Button
                              className="text-gray-400 hover:text-red-500"
                              disabled={removingFavoriteIds.has(item.id)}
                              onClick={() => handleRemoveFavorite(item.id)}
                              size="icon"
                              variant="ghost"
                            >
                              <Heart
                                className={removingFavoriteIds.has(item.id) ? 'animate-pulse' : 'fill-current'}
                                size={16}
                              />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )
                  : (
                      <div className="py-12 text-center">
                        <Heart className="mx-auto mb-3 text-gray-300" size={48} />
                        <p className="text-gray-400">还没有收藏任何景点</p>
                        <Button asChild className="mt-4" variant="outline">
                          <Link href="/attractions">去逛逛</Link>
                        </Button>
                      </div>
                    )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* 退出登录确认弹窗 */}
      <Dialog onOpenChange={setShowLogoutDialog} open={showLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出登录？</DialogTitle>
            <DialogDescription>
              退出后需要重新登录才能使用完整功能。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowLogoutDialog(false)} variant="outline">取消</Button>
            <Button onClick={confirmLogout} variant="destructive">确认退出</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
