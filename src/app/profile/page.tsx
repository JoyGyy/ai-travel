'use client'

import { Bot, Clock, Eye, EyeOff, Heart, Key, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

/**
 * 个人中心页面
 *
 * 展示用户信息、AI 使用额度、修改密码表单、
 * 收藏景点列表，支持取消收藏和退出登录。
 */
import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'

import { fetchFavoriteAttractions, unfavoriteAttraction } from '@/api/attractions'
import { changePasswordApi, getProfileApi } from '@/api/auth'
import { ApiError } from '@/api/client'
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
import { useAppToast } from '@/hooks/useAppToast'
import { formatFullDateTime } from '@/lib/utils/date'
import { useAuthStore } from '@/stores/auth'

export default function Profile() {
  // ---- 路由与全局状态 ----
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)

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

  // ---- 加载用户资料与收藏列表 ----
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
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        toast.info('登录已过期，请重新登录')
        logout()
        router.replace('/login')
        return
      }
      setLoadError(err instanceof Error ? err.message : '加载个人资料失败')
    } finally {
      setLoading(false)
    }
  }, [toast, logout, router])

  useEffect(() => {
    queueMicrotask(() => loadProfile())
  }, [loadProfile])

  // ---- 密码修改 ----
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
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        toast.info('登录已过期，请重新登录')
        logout()
        router.replace('/login')
        return
      }
      setPasswordErrors({
        currentPassword: err instanceof Error ? err.message : '密码修改失败',
      })
    } finally {
      setChangingPassword(false)
    }
  }

  // ---- 取消收藏 ----
  async function handleRemoveFavorite(attractionId: string) {
    setRemovingFavoriteIds((prev) => new Set(prev).add(attractionId))
    try {
      await unfavoriteAttraction(attractionId)
      setFavorites((prev) => prev.filter((item) => item.id !== attractionId))
      toast.success('已取消收藏')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : '取消收藏失败')
    } finally {
      setRemovingFavoriteIds((prev) => {
        const next = new Set(prev)
        next.delete(attractionId)
        return next
      })
    }
  }

  // ---- 退出登录 ----
  function handleLogout() {
    setShowLogoutDialog(true)
  }

  function confirmLogout() {
    setShowLogoutDialog(false)
    logout()
    router.replace('/')
  }

  // ---- 加载中骨架屏 ----
  if (loading) {
    return (
      <main className="travel-page-shell">
        <section className="travel-page-hero travel-ticket-edge travel-route-line">
          <p className="mb-2.5 w-fit rounded-full bg-primary/10 px-2.5 py-1.5 text-[12px] font-black tracking-[0.14em] text-primary-strong">
            PROFILE
          </p>
          <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.08] text-travel-ocean">
            个人中心
          </h1>
        </section>
        <div
          aria-label="正在加载个人中心"
          aria-live="polite"
          className="flex flex-col gap-[18px]"
          role="status"
        >
          <div className="overflow-hidden rounded-xl">
            <div className="animate-pulse p-6">
              <div className="mb-2 h-4 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl">
            <div className="animate-pulse p-6">
              <div className="mb-2 h-4 w-full rounded bg-muted" />
              <div className="mb-2 h-4 w-5/6 rounded bg-muted" />
              <div className="h-4 w-4/6 rounded bg-muted" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ---- 额度与显示名计算 ----
  const quota = profile?.aiQuota
  const quotaPercent = quota ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0
  const quotaDanger = quotaPercent >= 80
  const displayName = user?.username ?? profile?.username ?? '用户'

  return (
    <main aria-labelledby="profile-title" className="travel-page-shell">
      <section className="travel-page-hero travel-ticket-edge travel-route-line">
        <p className="mb-2.5 w-fit rounded-full bg-primary/10 px-2.5 py-1.5 text-[12px] font-black tracking-[0.14em] text-primary-strong">
          PROFILE
        </p>
        <h1 className="font-display text-[clamp(30px,5vw,48px)] leading-[1.08] text-travel-ocean" id="profile-title">
          个人中心
        </h1>
        <p className="mt-2 text-travel-muted">管理你的账户信息、AI 额度和目的地收藏。</p>
      </section>

      <div className="mx-auto flex max-w-[760px] flex-col gap-[18px]">
        {loadError ? (
          <div className="overflow-hidden rounded-xl p-4" role="alert">
            <h2 className="mb-2 text-lg font-bold text-travel-ocean">个人资料加载失败</h2>
            <p className="mb-3.5 text-travel-muted">{loadError}</p>
            <Button onClick={loadProfile}>重试</Button>
          </div>
        ) : null}

        {/* 用户信息卡 */}
        <div className="travel-surface-card travel-ticket-edge overflow-hidden bg-[radial-gradient(circle_at_88%_18%,rgba(var(--travel-primary-rgb),0.12),transparent_28%),var(--travel-surface)]">
          <div className="flex items-center gap-[18px]">
            <div
              className="flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-full bg-muted text-3xl"
            >
              {displayName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-[11px] font-black tracking-[0.14em] text-primary-strong">
                当前旅伴
              </p>
              <h2 className="text-2xl font-bold text-travel-ocean">{displayName}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-900/72">
                <Clock aria-hidden="true" className="h-4 w-4" />
                <span>
                  注册于 {profile?.createdAt ? formatFullDateTime(profile.createdAt) : '未知'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* AI 使用额度 */}
        <div className="travel-surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Bot aria-hidden="true" /> AI 使用额度
          </h3>
          {quota ? (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-travel-muted">今日已使用</span>
                <Badge
                  className={`travel-tag ${quota.remaining > 0 ? 'travel-tag--success' : 'travel-tag--danger'}`}
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
                className="h-2 w-full rounded-full bg-muted"
                role="progressbar"
              >
                <div
                  className={`h-full rounded-full transition-all ${quotaDanger ? 'bg-destructive' : 'bg-primary'}`}
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-travel-muted">
                {quota.remaining > 0
                  ? `剩余 ${quota.remaining} 次，每日 ${quota.limit} 次重置`
                  : '今日额度已用完，明天重置'}
              </p>
            </div>
          ) : (
            <div className="py-4 text-center text-muted-foreground">
              <p>无法获取额度信息</p>
            </div>
          )}
        </div>

        {/* 修改密码 */}
        <div className="travel-surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Key aria-hidden="true" /> 修改密码
          </h3>
          <form className="mt-4 space-y-4" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="currentPassword">
                当前密码
              </label>
              <div className="relative">
                <input
                  autoComplete="current-password"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm"
                  id="currentPassword"
                  name="currentPassword"
                  placeholder="请输入当前密码"
                  required
                  type={showCurrentPassword ? 'text' : 'password'}
                />
                <button
                  aria-label={showCurrentPassword ? '隐藏当前密码' : '显示当前密码'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  type="button"
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordErrors.currentPassword && (
                <p className="text-sm text-destructive" role="alert">
                  {passwordErrors.currentPassword}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="newPassword">
                新密码
              </label>
              <div className="relative">
                <input
                  autoComplete="new-password"
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 pr-10 text-sm"
                  id="newPassword"
                  minLength={6}
                  name="newPassword"
                  placeholder="请输入新密码（至少 6 位）"
                  required
                  type={showNewPassword ? 'text' : 'password'}
                />
                <button
                  aria-label={showNewPassword ? '隐藏新密码' : '显示新密码'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword((v) => !v)}
                  type="button"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirmPassword">
                确认新密码
              </label>
              <input
                autoComplete="new-password"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="请再次输入新密码"
                required
                type="password"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive" role="alert">
                  {passwordErrors.confirmPassword}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">修改密码后需要重新登录</p>
            <Button disabled={changingPassword} type="submit">
              {changingPassword ? '正在修改...' : '修改密码'}
            </Button>
          </form>
        </div>

        {/* 我的收藏 */}
        <div className="travel-surface-card p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Heart aria-hidden="true" /> 我的收藏 ({favorites.length})
          </h3>
          {favorites.length > 0 ? (
            <div className="mt-4 space-y-4">
              {favorites.map((item) => (
                <div
                  className="flex items-center justify-between rounded-xl border p-4"
                  key={item.id}
                >
                  <div>
                    <Link
                      className="font-medium text-primary hover:underline"
                      href={`/attractions/${item.id}`}
                    >
                      {item.name}
                    </Link>
                    <div className="mt-2 flex gap-2">
                      {item.city && <Badge variant="secondary">{item.city}</Badge>}
                      {item.ticketType === 'free' ? (
                        <Badge className="bg-green-100 text-green-800" variant="secondary">
                          免费
                        </Badge>
                      ) : (
                        item.priceText && (
                          <Badge className="bg-yellow-100 text-yellow-800" variant="secondary">
                            {item.priceText}
                          </Badge>
                        )
                      )}
                      {item.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    disabled={removingFavoriteIds.has(item.id)}
                    onClick={() => handleRemoveFavorite(item.id)}
                    size="sm"
                    variant="destructive"
                  >
                    取消收藏
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-4">还没有收藏景点</p>
              <Link href="/attractions">
                <Button>去逛逛</Button>
              </Link>
            </div>
          )}
        </div>

        {/* 退出登录 */}
        <div className="travel-surface-card p-6">
          <Button className="w-full" onClick={handleLogout} size="lg" variant="destructive">
            <LogOut aria-hidden="true" className="mr-2" />
            退出登录
          </Button>
        </div>
      </div>

      {/* 退出登录确认对话框 */}
      <Dialog onOpenChange={setShowLogoutDialog} open={showLogoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认退出</DialogTitle>
            <DialogDescription>确定要退出登录吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowLogoutDialog(false)} variant="outline">
              取消
            </Button>
            <Button onClick={confirmLogout} variant="destructive">
              确认退出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
