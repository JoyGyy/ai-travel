'use client'

import { Bot, Clock, Heart, Key, LogOut } from 'lucide-react'
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
import { useAppToast } from '@/hooks/useAppToast'
import { formatFullDateTime } from '@/lib/utils/date'
import { useAuthStore } from '@/stores/auth'

import './style.css'

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
    const formData = new FormData(event.currentTarget)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致')
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
      toast.error(err instanceof Error ? err.message : '密码修改失败')
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
    logout()
    router.replace('/')
  }

  // ---- 加载中骨架屏 ----
  if (loading) {
    return (
      <main className="profile-page travel-page-shell">
        <section className="profile-page__hero travel-page-hero travel-ticket-edge travel-route-line">
          <p className="profile-page__label">PROFILE</p>
          <h1>个人中心</h1>
        </section>
        <div
          aria-label="正在加载个人中心"
          aria-live="polite"
          className="profile-page__content"
          role="status"
        >
          <div className="profile-page__card travel-surface-card">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
          <div className="profile-page__card travel-surface-card">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-full mb-2" />
              <div className="h-4 bg-muted rounded w-5/6 mb-2" />
              <div className="h-4 bg-muted rounded w-4/6" />
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
    <main aria-labelledby="profile-title" className="profile-page travel-page-shell">
      <section className="profile-page__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="profile-page__label">PROFILE</p>
        <h1 id="profile-title">个人中心</h1>
        <p>管理你的账户信息、AI 额度和目的地收藏。</p>
      </section>

      <div className="profile-page__content">
        {loadError ? (
          <div
            className="profile-page__card profile-page__error-card travel-surface-card"
            role="alert"
          >
            <h2>个人资料加载失败</h2>
            <p>{loadError}</p>
            <Button onClick={loadProfile}>重试</Button>
          </div>
        ) : null}

        {/* 用户信息卡 */}
        <div className="profile-page__card profile-page__user-card travel-surface-card travel-ticket-edge">
          <div className="profile-page__user-info">
            <div
              className="profile-page__avatar flex items-center justify-center rounded-full bg-muted text-3xl"
              style={{ height: 76, width: 76 }}
            >
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="profile-page__user-detail">
              <p className="profile-page__user-eyebrow">当前旅伴</p>
              <h2 className="profile-page__username">{displayName}</h2>
              <p className="profile-page__meta">
                <Clock aria-hidden="true" />
                <span>
                  注册于 {profile?.createdAt ? formatFullDateTime(profile.createdAt) : '未知'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* AI 使用额度 */}
        <div className="profile-page__card travel-surface-card">
          <h3 className="text-lg font-semibold">
            <Bot aria-hidden="true" /> AI 使用额度
          </h3>
          {quota ? (
            <div className="profile-page__quota">
              <div className="profile-page__quota-header">
                <span>今日已使用</span>
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
              <p className="profile-page__quota-tip">
                {quota.remaining > 0
                  ? `剩余 ${quota.remaining} 次，每日 ${quota.limit} 次重置`
                  : '今日额度已用完，明天重置'}
              </p>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>无法获取额度信息</p>
            </div>
          )}
        </div>

        {/* 修改密码 */}
        <div className="profile-page__card travel-surface-card">
          <h3 className="text-lg font-semibold">
            <Key aria-hidden="true" /> 修改密码
          </h3>
          <form className="profile-page__password-form space-y-4" onSubmit={handlePasswordChange}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="currentPassword">
                当前密码
              </label>
              <input
                autoComplete="current-password"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                id="currentPassword"
                name="currentPassword"
                placeholder="请输入当前密码"
                required
                type="password"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="newPassword">
                新密码
              </label>
              <input
                autoComplete="new-password"
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                id="newPassword"
                minLength={6}
                name="newPassword"
                placeholder="请输入新密码（至少 6 位）"
                required
                type="password"
              />
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
            </div>
            <Button disabled={changingPassword} type="submit">
              {changingPassword ? '正在修改...' : '修改密码'}
            </Button>
          </form>
        </div>

        {/* 我的收藏 */}
        <div className="profile-page__card travel-surface-card">
          <h3 className="text-lg font-semibold">
            <Heart aria-hidden="true" /> 我的收藏 ({favorites.length})
          </h3>
          {favorites.length > 0 ? (
            <div className="profile-page__favorites-list space-y-4">
              {favorites.map((item) => (
                <div
                  className="flex items-center justify-between p-4 border rounded-xl"
                  key={item.id}
                >
                  <div>
                    <Link
                      className="profile-page__fav-title font-medium"
                      href={`/attractions/${item.id}`}
                    >
                      {item.name}
                    </Link>
                    <div className="profile-page__fav-meta mt-2 flex gap-2">
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
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-4">还没有收藏景点</p>
              <Link href="/attractions">
                <Button>去逛逛</Button>
              </Link>
            </div>
          )}
        </div>

        {/* 退出登录 */}
        <div className="profile-page__card profile-page__logout-card travel-surface-card">
          <Button className="w-full" onClick={handleLogout} size="lg" variant="destructive">
            <LogOut aria-hidden="true" className="mr-2" />
            退出登录
          </Button>
        </div>
      </div>
    </main>
  )
}
