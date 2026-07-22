/**
 * 全局布局组件
 * 包含顶部导航栏（TopNav）、路由内容区域和懒加载 Suspense fallback
 * 根据当前路径决定是否显示导航栏（首页和登录页隐藏）
 */
import { CloudOutlined, CompassOutlined, EnvironmentOutlined, HomeOutlined, RobotOutlined, UserOutlined } from '@ant-design/icons'
import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'

import { imageUrl } from '@/lib/images'
import { useAuthStore } from '@/stores/auth'

import './style.css'

/* ========== 公安备案配置 ========== */

const policeRecordCode = '33019202003146'
const policeRecordText = `浙公网安备${policeRecordCode}号`
const policeRecordHref = `https://beian.mps.gov.cn/#/query/webSearch?code=${policeRecordCode}`

/* ========== 导航标签配置 ========== */

const tabs = [
  { key: '/', title: '首页', icon: <HomeOutlined aria-hidden="true" /> },
  { key: '/weather', title: '天气', icon: <CloudOutlined aria-hidden="true" /> },
  { key: '/attractions', title: '景点', icon: <EnvironmentOutlined aria-hidden="true" /> },
  { key: '/chat', title: 'AI咨询', icon: <RobotOutlined aria-hidden="true" /> },
] as const

/** 根据路径判断是否显示导航栏（首页和登录页不显示） */
function shouldShowNav(pathname: string) {
  if (pathname === '/' || pathname === '/login')
    return false

  return pathname === '/weather'
    || pathname === '/chat'
    || pathname === '/profile'
    || pathname === '/detail'
    || pathname === '/attractions'
    || pathname.startsWith('/attractions/')
}

/* ========== 顶部导航栏 ========== */

/** 顶部导航栏组件：品牌标识 + 标签页 + 用户入口 */
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
                <NavLink
                  to="/profile"
                  className={({ isActive }) => `layout-nav__username ${isActive ? 'layout-nav__username--active' : ''}`}
                  aria-label={`当前用户：${user.username}，进入个人中心`}
                >
                  <UserOutlined aria-hidden="true" />
                  <span>{user.username}</span>
                </NavLink>
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

/* ========== 懒加载 fallback ========== */

/** 加载中占位组件 */
function LoadingFallback() {
  return (
    <div className="layout-loading" role="status" aria-live="polite">
      <div className="layout-loading__spinner" aria-hidden="true" />
      <span className="layout-loading__text">加载中...</span>
    </div>
  )
}

/* ========== 页脚备案信息 ========== */

/** 公安备案链接：按备案要求展示图标与备案号 */
export function PoliceRecordLink() {
  return (
    <a className="layout-police-record" href={policeRecordHref} rel="noreferrer" target="_blank">
      <img className="layout-police-record__icon" src={imageUrl('/images/beian-gongan.png')} alt="公安备案图标" />
      <span>{policeRecordText}</span>
    </a>
  )
}

/** 全站页脚：集中放置版权与备案信息 */
function SiteFooter() {
  return (
    <footer className="layout-footer" aria-label="网站备案信息">
      <span className="layout-footer__copyright">© 2026 Travel AI</span>
      <PoliceRecordLink />
    </footer>
  )
}

/* ========== 主布局 ========== */

/** 全局布局：导航栏 + Suspense 包裹的路由出口 */
export default function Layout() {
  const location = useLocation()
  const showNav = shouldShowNav(location.pathname)

  /** 路由切换时重置滚动位置到顶部 */
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
      <SiteFooter />
    </div>
  )
}
