/**
 * 布局组件
 * 包含顶部导航栏和内容区域
 */
import { Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { HomeOutlined, CloudOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/stores/auth'
import './style.css'

/** 顶部导航 */
function TopNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)

  const activeKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  const tabs = [
    { key: '/', title: '首页', icon: <HomeOutlined /> },
    { key: '/weather', title: '天气', icon: <CloudOutlined /> },
    { key: '/chat', title: 'AI咨询', icon: <RobotOutlined /> },
  ]

  return (
    <nav className="layout-nav">
      <div className="layout-nav__inner">
        <div className="layout-nav__brand" onClick={() => navigate('/')}>
          <span className="layout-nav__logo">✈</span>
          <span className="layout-nav__title">旅行助手</span>
        </div>
        <div className="layout-nav__tabs">
          {tabs.map(tab => {
            const isActive = activeKey === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.key)}
                className={`layout-nav__tab ${isActive ? 'layout-nav__tab--active' : ''}`}
              >
                <span className="layout-nav__tab-icon">{tab.icon}</span>
                <span>{tab.title}</span>
                {isActive && <span className="layout-nav__indicator" />}
              </button>
            )
          })}
        </div>
        <div className="layout-nav__user">
          {user ? (
            <span className="layout-nav__username">{user.username}</span>
          ) : (
            <button className="layout-nav__login-btn" onClick={() => navigate('/login')}>
              <UserOutlined /> 登录
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

/** 加载中状态 */
function LoadingFallback() {
  return (
    <div className="layout-loading">
      <div className="layout-loading__spinner" />
      <span className="layout-loading__text">加载中...</span>
    </div>
  )
}

/** 布局组件 */
export default function Layout() {
  const location = useLocation()
  const tabRoutes = ['/', '/weather', '/chat']
  const showNav = tabRoutes.includes(location.pathname) || location.pathname === '/login'

  return (
    <div className="layout">
      {showNav && <TopNav />}
      <div className="layout__content">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
