import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'
import {
  ClockCircleOutlined,
  HeartOutlined,
  KeyOutlined,
  LogoutOutlined,
  RobotOutlined,
  SafetyOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  Avatar,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  message,
  Progress,
  Skeleton,
  Tag,
} from 'antd'

import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { fetchFavoriteAttractions, unfavoriteAttraction } from '@/api/attractions'
import { changePasswordApi, getProfileApi } from '@/api/auth'
import { ApiError } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

import './style.css'

export default function Profile() {
  const navigate = useNavigate()
  const logout = useAuthStore(state => state.logout)
  const user = useAuthStore(state => state.user)

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [favorites, setFavorites] = useState<Attraction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [removingFavoriteIds, setRemovingFavoriteIds] = useState<Set<string>>(() => new Set())
  const [msg, contextHolder] = message.useMessage()
  const [form] = Form.useForm()

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
        msg.warning('登录已过期，请重新登录')
        logout()
        navigate('/login', { replace: true })
        return
      }
      setLoadError(err instanceof Error ? err.message : '加载个人资料失败')
    }
    finally {
      setLoading(false)
    }
  }, [msg, logout, navigate])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handlePasswordChange(values: { currentPassword: string, newPassword: string }) {
    setChangingPassword(true)
    try {
      await changePasswordApi(values.currentPassword, values.newPassword)
      msg.success('密码修改成功，请重新登录')
      form.resetFields()
      setTimeout(() => {
        logout()
        navigate('/login', { replace: true })
      }, 1500)
    }
    catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        msg.warning('登录已过期，请重新登录')
        logout()
        navigate('/login', { replace: true })
        return
      }
      msg.error(err instanceof Error ? err.message : '密码修改失败')
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
      msg.success('已取消收藏')
    }
    catch (err: unknown) {
      msg.error(err instanceof Error ? err.message : '取消收藏失败')
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
    logout()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <main className="profile-page travel-page-shell">
        {contextHolder}
        <section className="profile-page__hero travel-page-hero travel-ticket-edge travel-route-line">
          <p className="profile-page__label">PROFILE</p>
          <h1>个人中心</h1>
        </section>
        <div className="profile-page__content" role="status" aria-live="polite" aria-label="正在加载个人中心">
          <Card className="profile-page__card travel-surface-card"><Skeleton active avatar paragraph={{ rows: 2 }} /></Card>
          <Card className="profile-page__card travel-surface-card"><Skeleton active paragraph={{ rows: 3 }} /></Card>
        </div>
      </main>
    )
  }

  const quota = profile?.aiQuota
  const quotaPercent = quota ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0
  const quotaDanger = quotaPercent >= 80
  const displayName = user?.username ?? profile?.username ?? '用户'

  return (
    <main className="profile-page travel-page-shell" aria-labelledby="profile-title">
      {contextHolder}
      <section className="profile-page__hero travel-page-hero travel-ticket-edge travel-route-line">
        <p className="profile-page__label">PROFILE</p>
        <h1 id="profile-title">个人中心</h1>
        <p>管理你的账户信息、AI 额度和目的地收藏。</p>
      </section>

      <div className="profile-page__content">
        {loadError
          ? (
              <Card className="profile-page__card profile-page__error-card travel-surface-card" variant="borderless" role="alert">
                <h2>个人资料加载失败</h2>
                <p>{loadError}</p>
                <Button type="primary" onClick={loadProfile}>重试</Button>
              </Card>
            )
          : null}

        {/* 用户信息卡 */}
        <Card className="profile-page__card profile-page__user-card travel-surface-card travel-ticket-edge" variant="borderless">
          <div className="profile-page__user-info">
            <Avatar size={76} icon={<UserOutlined aria-hidden="true" />} className="profile-page__avatar">
              {displayName[0]?.toUpperCase()}
            </Avatar>
            <div className="profile-page__user-detail">
              <p className="profile-page__user-eyebrow">当前旅伴</p>
              <h2 className="profile-page__username">{displayName}</h2>
              <p className="profile-page__meta">
                <ClockCircleOutlined aria-hidden="true" />
                <span>
                  注册于
                  {' '}
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : '未知'}
                </span>
              </p>
            </div>
          </div>
        </Card>

        {/* AI 使用额度 */}
        <Card
          className="profile-page__card travel-surface-card"
          variant="borderless"
          title={(
            <>
              <RobotOutlined aria-hidden="true" />
              {' '}
              AI 使用额度
            </>
          )}
        >
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
        </Card>

        {/* 修改密码 */}
        <Card
          className="profile-page__card travel-surface-card"
          variant="borderless"
          title={(
            <>
              <KeyOutlined aria-hidden="true" />
              {' '}
              修改密码
            </>
          )}
        >
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
              <Input.Password prefix={<SafetyOutlined aria-hidden="true" />} placeholder="请输入当前密码" autoComplete="current-password" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少 6 个字符' },
              ]}
            >
              <Input.Password prefix={<SafetyOutlined aria-hidden="true" />} placeholder="请输入新密码（至少 6 位）" autoComplete="new-password" />
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
              <Input.Password prefix={<SafetyOutlined aria-hidden="true" />} placeholder="请再次输入新密码" autoComplete="new-password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                {changingPassword ? '正在修改...' : '修改密码'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 我的收藏 */}
        <Card
          className="profile-page__card travel-surface-card"
          variant="borderless"
          title={(
            <>
              <HeartOutlined aria-hidden="true" />
              {' '}
              我的收藏 (
              {favorites.length}
              )
            </>
          )}
        >
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
                        title={<Link className="profile-page__fav-title" to={`/attractions/${item.id}`}>{item.name}</Link>}
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
                  <Link to="/attractions"><Button type="primary">去逛逛</Button></Link>
                </Empty>
              )}
        </Card>

        {/* 退出登录 */}
        <Card className="profile-page__card profile-page__logout-card travel-surface-card" variant="borderless">
          <Button
            block
            danger
            icon={<LogoutOutlined aria-hidden="true" />}
            size="large"
            onClick={handleLogout}
          >
            退出登录
          </Button>
        </Card>
      </div>
    </main>
  )
}
