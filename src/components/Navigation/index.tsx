'use client'

/**
 * 全局导航组件（Client Component）
 * 包含顶部导航栏，根据当前路径决定是否显示
 */
import {
  CloudOutlined,
  CompassOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  RobotOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { useAuthStore } from '@/stores/auth'

import './style.css'

/* ========== 导航标签配置 ========== */

const tabs = [
  { key: '/', title: '首页', icon: <HomeOutlined aria-hidden="true" /> },
  { key: '/weather', title: '天气', icon: <CloudOutlined aria-hidden="true" /> },
  { key: '/attractions', title: '景点', icon: <EnvironmentOutlined aria-hidden="true" /> },
  { key: '/community', title: '社区', icon: <TeamOutlined aria-hidden="true" /> },
  { key: '/chat', title: 'AI咨询', icon: <RobotOutlined aria-hidden="true" /> },
] as const

/** 根据路径判断是否显示导航栏 */
function shouldShowNav(pathname: string) {
  if (pathname === '/' || pathname === '/login')
    return false

  return pathname === '/weather'
    || pathname === '/chat'
    || pathname === '/profile'
    || pathname === '/detail'
    || pathname === '/attractions'
    || pathname.startsWith('/attractions/')
    || pathname === '/community'
    || pathname.startsWith('/community/')
}

/* ========== 顶部导航栏 ========== */

function TopNav() {
  const user = useAuthStore(state => state.user)
  const pathname = usePathname()

  return (
    <nav className="layout-nav" aria-label="主导航">
      <div className="layout-nav__inner">
        <Link className="layout-nav__brand" href="/" aria-label="返回首页">
          <span className="layout-nav__logo" aria-hidden="true"><CompassOutlined /></span>
          <span className="layout-nav__title">Travel AI</span>
        </Link>
        <div className="layout-nav__tabs" role="list">
          {tabs.map(tab => (
            <Link
              key={tab.key}
              href={tab.key}
              className={`layout-nav__tab ${pathname === tab.key || (tab.key !== '/' && pathname?.startsWith(tab.key)) ? 'layout-nav__tab--active' : ''}`}
            >
              <span className="layout-nav__tab-icon">{tab.icon}</span>
              <span>{tab.title}</span>
              <span className="layout-nav__indicator" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <div className="layout-nav__user">
          {user
            ? (
                <Link
                  href="/profile"
                  className={`layout-nav__username ${pathname === '/profile' ? 'layout-nav__username--active' : ''}`}
                  aria-label={`当前用户：${user.username}，进入个人中心`}
                >
                  <UserOutlined aria-hidden="true" />
                  <span>{user.username}</span>
                </Link>
              )
            : (
                <Link className="layout-nav__login-btn" href="/login">
                  <UserOutlined aria-hidden="true" />
                  登录
                </Link>
              )}
        </div>
      </div>
    </nav>
  )
}

/* ========== 导出 ========== */

export function Navigation() {
  const pathname = usePathname()
  const showNav = shouldShowNav(pathname || '')

  if (!showNav) return null

  return <TopNav />
}
