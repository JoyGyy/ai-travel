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

import type { ProfileData } from '@/types/api'
import type { Attraction } from '@/types/attraction'

import { fetchFavoriteAttractions, unfavoriteAttraction } from '@/api/attractions'
import { getProfileApi, changePasswordApi } from '@/api/auth'
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
  const [changingPassword, setChangingPassword] = useState(false)
  const [msg, contextHolder] = message.useMessage()
  const [form] = Form.useForm()

  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const [profileResult, favResult] = await Promise.all([
        getProfileApi(),
        fetchFavoriteAttractions(),
      ])
      setProfile(profileResult.profile)
      setFavorites(favResult.items)
    }
    catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        msg.warning('登录已过期，请重新登录')
        logout()
        navigate('/login', { replace: true })
        return
      }
      msg.error(err instanceof Error ? err.message : '加载个人资料失败')
    }
    finally {
      setLoading(false)
    }
  }, [msg, logout, navigate])

  /* eslint-disable react-hooks/set-state-in-effect -- 初始化数据加载 */
  useEffect(() => {
    loadProfile()
  }, [loadProfile])
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handlePasswordChange(values: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    if (values.newPassword !== values.confirmPassword) {
      msg.error('两次输入的新密码不一致')
      return
    }

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
    catch (err) {
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
    try {
      await unfavoriteAttraction(attractionId)
      setFavorites(prev => prev.filter(item => item.id !== attractionId))
      msg.success('已取消收藏')
    }
    catch (err) {
      msg.error(err instanceof Error ? err.message : '取消收藏失败')
    }
  }

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  if (loading) {
    return (
      <main className="profile-page">
        {contextHolder}
        <section className="profile-page__hero">
          <p className="profile-page__label">PROFILE</p>
          <h1>个人中心</h1>
        </section>
        <div className="profile-page__content">
          <Card className="profile-page__card"><Skeleton active avatar paragraph={{ rows: 2 }} /></Card>
          <Card className="profile-page__card"><Skeleton active paragraph={{ rows: 3 }} /></Card>
        </div>
      </main>
    )
  }

  const quota = profile?.aiQuota
  const quotaPercent = quota ? Math.round((quota.used / quota.limit) * 100) : 0

  return (
    <main className="profile-page" aria-labelledby="profile-title">
      {contextHolder}
      <section className="profile-page__hero">
        <p className="profile-page__label">PROFILE</p>
        <h1 id="profile-title">个人中心</h1>
        <p>管理你的账户信息和偏好设置</p>
      </section>

      <div className="profile-page__content">
        {/* 用户信息卡 */}
        <Card className="profile-page__card profile-page__user-card" variant="borderless">
          <div className="profile-page__user-info">
            <Avatar size={72} icon={<UserOutlined />} className="profile-page__avatar">
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
            <div className="profile-page__user-detail">
              <h2 className="profile-page__username">{user?.username ?? profile?.username ?? '用户'}</h2>
              <p className="profile-page__meta">
                <ClockCircleOutlined />
                {' '}
                注册于
                {' '}
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : '未知'}
              </p>
            </div>
          </div>
        </Card>

        {/* AI 使用额度 */}
        <Card className="profile-page__card" variant="borderless" title={<><RobotOutlined /> AI 使用额度</>}>
          {quota
            ? (
                <div className="profile-page__quota">
                  <div className="profile-page__quota-header">
                    <span>今日已使用</span>
                    <Tag color={quota.remaining > 0 ? 'green' : 'red'}>
                      {quota.used}
                      {' / '}
                      {quota.limit}
                    </Tag>
                  </div>
                  <Progress
                    percent={quotaPercent}
                    strokeColor={quotaPercent >= 80 ? '#ff4d4f' : '#1890ff'}
                    showInfo={false}
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
        <Card className="profile-page__card" variant="borderless" title={<><KeyOutlined /> 修改密码</>}>
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
              <Input.Password prefix={<SafetyOutlined />} placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码长度至少 6 个字符' },
              ]}
            >
              <Input.Password prefix={<SafetyOutlined />} placeholder="请输入新密码（至少 6 位）" />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              rules={[{ required: true, message: '请再次输入新密码' }]}
            >
              <Input.Password prefix={<SafetyOutlined />} placeholder="请再次输入新密码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* 我的收藏 */}
        <Card className="profile-page__card" variant="borderless" title={<><HeartOutlined /> 我的收藏 ({favorites.length})</>}>
          {favorites.length > 0
            ? (
                <List
                  dataSource={favorites}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button
                          key="remove"
                          type="link"
                          danger
                          size="small"
                          onClick={() => handleRemoveFavorite(item.id)}
                        >
                          取消收藏
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta
                        title={<Link to={`/attractions/${item.id}`}>{item.name}</Link>}
                        description={(
                          <div className="profile-page__fav-meta">
                            {item.city && <Tag>{item.city}</Tag>}
                            {item.ticketType === 'free'
                              ? <Tag color="green">免费</Tag>
                              : item.priceText && <Tag color="orange">{item.priceText}</Tag>}
                            {item.tags?.slice(0, 3).map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
                          </div>
                        )}
                      />
                    </List.Item>
                  )}
                />
              )
            : <Empty description="还没有收藏景点" image={Empty.PRESENTED_IMAGE_SIMPLE}>
                <Link to="/attractions"><Button type="primary">去逛逛</Button></Link>
              </Empty>}
        </Card>

        {/* 退出登录 */}
        <Card className="profile-page__card profile-page__logout-card" variant="borderless">
          <Button
            block
            danger
            icon={<LogoutOutlined />}
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
