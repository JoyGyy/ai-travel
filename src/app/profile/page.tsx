'use client'

/**
 * 个人中心页面
 *
 * 展示用户信息、AI 使用额度、修改密码表单、
 * 收藏景点列表，支持取消收藏和退出登录。
 */
import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'

import {
  Clock,
  Heart,
  Key,
  LogOut,
  Bot,
  Shield,
  User,
} from 'lucide-react'
import Link from 'next/link'

import { useAppToast } from '@/hooks/useAppToast'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { fetchFavoriteAttractions, unfavoriteAttraction } from '@/api/attractions'
import { changePasswordApi, getProfileApi } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

import './style.css'

export default function Profile() {
  // ---- 路由与全局状态 ----
  const router = useRouter()
  const logout = useAuthStore(state => state.logout)
  const user = useAuthStore(state => state.user)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [favorites, setFavorites] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [removingFavoriteIds, setRemovingFavoriteIds] = useState<Set<string>>(() => new Set())
  const toast = useAppToast()
  const [form] = Form.useForm()

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
    }
    catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        toast.warning('登录已过期，请重新登录')
        logout()
        router.replace('/login')
        return
      }
      setLoadError(err instanceof Error ? err.message : '加载个人资料失败')
    }
    finally {
      setLoading(false)
    }
  }, [msg, logout, router])

  useEffect(() => {
    queueMicrotask(() => loadProfile())
  }, [loadProfile])

  // ---- 密码修改 ----
  async function handlePasswordChange(values: { currentPassword: string, newPassword: string }) {
    setChangingPassword(true)
    try {
      await changePasswordApi(values.currentPassword, values.newPassword)
      toast.success('密码修改成功，请重新登录')
      form.resetFields()
      setTimeout(() => {
        logout()
        router.replace('/login')
      }, 1500)
    }
    catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        toast.warning('登录已过期，请重新登录')
        logout()
        router.replace('/login')
        return
      }
      toast.error(err instanceof Error ? err.message : '密码修改失败')
    }
    finally {
      setChangingPassword(false)
    }
  }

  // ---- 取消收藏 ----
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
        <div className="profile-page__content" role="status" aria-live="polite" aria-label="正在加载个人中心">
          <div className="profile-page__card travel-surface-card"><div className="animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mb-2"></div><div className="h-4 bg-muted rounded w-1/2"></div></div></div>
          <div className="profile-page__card travel-surface-card"><div className="animate-pulse"><div className="h-4 bg-muted rounded w-full mb-2"></div><div className="h-4 bg-muted rounded w-5/6 mb-2"></div><div className="h-4 bg-muted rounded w-4/6"></div></div></div>
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
    <main className="profile-page travel-page-shell" aria-labelledby="profile-title">
      <section className="profile-page__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="profile-page__label">PROFILE</p>
        <h1 id="profile-title">个人中心</h1>
        <p>管理你的账户信息、AI 额度和目的地收藏。</p>
      </section>

      <div className="profile-page__content">
        {loadError
          ? (
              <div className="profile-page__card profile-page__error-card travel-surface-card"  role="alert">
                <h2>个人资料加载失败</h2>
                <p>{loadError}</p>
                <Button onClick={loadProfile}>重试</Button>
              </div>
            )
          : null}

        {/* 用户信息卡 */}
        <div className="profile-page__card profile-page__user-card travel-surface-card travel-ticket-edge" >
          <div className="profile-page__user-info">
            <div className="flex items-center justify-center rounded-full bg-muted" style={{ width: 76, height: 76 }} className="text-3xl" className="profile-page__avatar">
              {displayName[0]?.toUpperCase()}
            </div>
            <div className="profile-page__user-detail">
              <p className="profile-page__user-eyebrow">当前旅伴</p>
              <h2 className="profile-page__username">{displayName}</h2>
              <p className="profile-page__meta">
                <Clock aria-hidden="true" />
                <span>
                  注册于
                  {' '}
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : '未知'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* AI 使用额度 */}
        <div className="profile-page__card travel-surface-card">
          <h3 className="text-lg font-semibold">
            <Bot aria-hidden="true" />
            {' '}
            AI 使用额度
          </h3>
          {quota
            ? (
                <div className="profile-page__quota">
                  <div className="profile-page__quota-header">
                    <span>今日已使用</span>
                    <Tag className={`travel-tag ${quota.remaining > 0 ? 'travel-tag--success' : 'travel-tag--danger'}`}>
                      {quota.used}
                      {' / '}
                      {quota.limit}
                    </Tag>
                  </div>
                  <Progress
                    percent={quotaPercent}
                    strokeColor={quotaDanger ? 'var(--color-danger)' : 'var(--color-primary)'}
                    showInfo={false}
                    aria-label={`AI 额度已使用 ${quota.used} 次，共 ${quota.limit} 次`}
                  />
                  <p className="profile-page__quota-tip">
                    {quota.remaining > 0
                      ? `剩余 ${quota.remaining} 次，每日 ${quota.limit} 次重置`
                      : '今日额度已用完，明天重置'}
                  </p>
                </div>
              )
            : <Empty description="无法获取额度信息" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
        </div>

        {/* 修改密码 */}
        <div className="profile-page__card travel-surface-card">
          <h3 className="text-lg font-semibold">
            <Key aria-hidden="true" />
            {' '}
            修改密码
          </h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={handlePasswordChange}
            className="profile-page__password-form"
          >
            <Form.Item
              name="currentPassword"
              label="当前密码"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password prefix={<Shield aria-hidden="true" />} placeholder="请输入当前密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少 6 个字符' },
              ]}
            >
              <Input.Password prefix={<Shield aria-hidden="true" />} placeholder="请输入新密码（至少 6 位）" autoComplete="new-password" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请再次输入新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value)
                      return Promise.resolve()
                    return Promise.reject(new Error('两次输入的新密码不一致'))
                  },
                }),
              ]}
            >
              <Input.Password prefix={<Shield aria-hidden="true" />} placeholder="请再次输入新密码" autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button htmlType="submit" loading={changingPassword}>
                {changingPassword ? '正在修改...' : '修改密码'}
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* 我的收藏 */}
        <div className="profile-page__card travel-surface-card">
          <h3 className="text-lg font-semibold">
            <Heart aria-hidden="true" />
            {' '}
            我的收藏 ({favorites.length})
          </h3>
          {favorites.length > 0
            ? (
                <List
                  className="profile-page__favorites-list"
                  dataSource={favorites}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button
                          key="remove"
                          danger
                          loading={removingFavoriteIds.has(item.id)}
                          disabled={removingFavoriteIds.has(item.id)}
                          onClick={() => handleRemoveFavorite(item.id)}
                        >
                          取消收藏
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        <h3 className="text-lg font-semibold"><Link className="profile-page__fav-title" href={`/attractions/${item.id}`}>{item.name}</Link>}
                        description={(
                          <div className="profile-page__fav-meta">
                            {item.city && <Tag className="travel-tag travel-tag--info">{item.city}</Tag>}
                            {item.ticketType === 'free'
                              ? <Tag className="travel-tag travel-tag--free">免费</Tag>
                              : item.priceText && <Tag className="travel-tag travel-tag--paid">{item.priceText}</Tag>}
                            {item.tags?.slice(0, 3).map(tag => <Tag key={tag} className="travel-tag travel-tag--info">{tag}</Tag>)}
                          </div>
                        )}
                      />
                    </List.Item>
                  )}
                />
              )
            : (
                <Empty description="还没有收藏景点" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                  <Link href="/attractions"><Button>去逛逛</Button></Link>
                </Empty>
              )}
        </div>

        {/* 退出登录 */}
        <div className="profile-page__card profile-page__logout-card travel-surface-card" >
          <Button
            block
            danger
            icon={<LogOut aria-hidden="true" />}
            size="large"
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </div>
      </div>
    </main>
  )
}
