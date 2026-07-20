import { CloudOutlined, CompassOutlined, EnvironmentOutlined, HomeOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
/**
 * 布局组件
 * 包含顶部导航栏和内容区域
 */
import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import './style.css'

const tabs = [
  { key: '/', title: '首页', icon: <HomeOutlined aria-hidden="true" /> },
  { key: '/weather', title: '天气', icon: <CloudOutlined aria-hidden="true" /> },
  { key: '/attractions', title: '景点', icon: <EnvironmentOutlined aria-hidden="true" /> },
  { key: '/chat', title: 'AI咨询', icon: <RobotOutlined aria-hidden="true" /> },
] as const

/** 顶部导航 */
function TopNav() {
  const user = useAuthStore(state => state.user)

  return (
    <nav className="layout-nav" aria-label="主导航">
      <div className="layout-nav__inner">
        <Link className="layout-nav__brand" to="/" aria-label="返回首页">
          <span className="layout-nav__logo" aria-hidden="true"><CompassOutlined /></span>
          <span className="layout-nav__title">Travel AI</span>
        </Link>
        <div className="layout-nav__tabs" role="list">
          {tabs.map(tab => (
            <NavLink
              key={tab.key}
              to={tab.key}
              end={tab.key === '/'}
              className={({ isActive }) => `layout-nav__tab ${isActive ? 'layout-nav__tab--active' : ''}`}
            >
              <span className="layout-nav__tab-icon">{tab.icon}</span>
              <span>{tab.title}</span>
              <span className="layout-nav__indicator" aria-hidden="true" />
            </NavLink>
          ))}
        </div>
        <div className="layout-nav__user">
          {user
            ? (
                <span className="layout-nav__username" aria-label={`当前用户：${user.username}`}>{user.username}</span>
              )
            : (
                <Link className="layout-nav__login-btn" to="/login">
                  <UserOutlined aria-hidden="true" />
                  登录
                </Link>
              )}
        </div>
      </div>
    </nav>
  )
}

/** 加载中状态 */
function LoadingFallback() {
  return (
    <div className="layout-loading" role="status" aria-live="polite">
      <div className="layout-loading__spinner" aria-hidden="true" />
      <span className="layout-loading__text">加载中...</span>
    </div>
  )
}

/** 布局组件 */
export default function Layout() {
  const location = useLocation()
  const navRoutes = ['/weather', '/attractions', '/chat']
  const showNav = navRoutes.includes(location.pathname)

  useEffect(() => {
    const content = document.getElementById('main-content')
    if (content)
      content.scrollTop = 0
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="layout">
      {showNav && <a className="layout__skip" href="#main-content">跳到主要内容</a>}
      {showNav && <TopNav />}
      <div id="main-content" className="layout__content">
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}
