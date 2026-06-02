/**
 * 路由配置文件
 * 定义应用的所有路由规则和页面组件
 */
import React, { Suspense } from 'react'
import { createBrowserRouter, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppOutline, UnorderedListOutline, ChatAddOutline, CompassOutline, UserOutline } from 'antd-mobile-icons'
import { TabBar } from '@/components/TabBar'

const Home = React.lazy(() => import('@/pages/Home'))
const Detail = React.lazy(() => import('@/pages/Detail'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const History = React.lazy(() => import('@/pages/History'))
const Profile = React.lazy(() => import('@/pages/Profile'))

/** PC 端顶部水平导航 */
function DesktopNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  const tabs = [
    { key: '/', title: '首页', icon: <AppOutline /> },
    { key: '/history', title: '历史', icon: <UnorderedListOutline /> },
    { key: '/chat', title: 'AI咨询', icon: <ChatAddOutline /> },
    { key: '/profile', title: '我的', icon: <UserOutline /> },
  ]

  return (
    <nav className="flex items-center gap-0.5">
      {tabs.map(tab => {
        const isActive = activeKey === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-none cursor-pointer text-sm transition-all duration-200 relative"
            style={{
              background: isActive ? 'var(--c-sand)' : 'transparent',
              color: isActive ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
              fontWeight: isActive ? 600 : 400,
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--c-paper)' }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.title}</span>
            {isActive && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                style={{ width: '20px', height: '3px', background: 'var(--c-terracotta)' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}

/** 布局组件 */
function Layout() {
  const location = useLocation()

  const tabRoutes = ['/', '/history', '/chat', '/profile']
  const showTabbar = tabRoutes.includes(location.pathname)

  return (
    <div className={`flex flex-col h-screen ${showTabbar ? 'pb-[56px] md:pb-0' : ''}`} style={{ background: 'var(--c-paper)' }}>
      {/* PC 端顶部导航 */}
      {showTabbar && (
        <div
          className="hidden md:block sticky top-0 z-50"
          style={{
            background: 'rgba(255, 252, 248, 0.72)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderBottom: '1px solid rgba(240, 232, 221, 0.5)',
          }}
        >
          <div className="mx-auto flex items-center" style={{ maxWidth: '1200px', height: '60px', padding: '0 24px' }}>
            <div className="flex items-center gap-2 mr-8">
              <CompassOutline style={{ fontSize: '20px', color: 'var(--c-terracotta)' }} />
              <span className="text-[15px] font-bold tracking-wide" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-ink)' }}>
                旅行助手
              </span>
            </div>
            <DesktopNav />
          </div>
        </div>
      )}

      {/* 内容区域 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-dotted"
                style={{ borderColor: 'var(--c-paper-dark)', borderTopColor: 'var(--c-terracotta)', animation: 'spin 1s linear infinite' }}
              />
              <span className="text-[12px]" style={{ color: 'var(--c-ink-light)' }}>加载中...</span>
            </div>
          </div>
        }
      >
        <Outlet />
      </Suspense>

      {/* 移动端底部导航 */}
      {showTabbar && (
        <div className="md:hidden">
          <TabBar />
        </div>
      )}
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'detail', element: <Detail /> },
      { path: 'chat', element: <Chat /> },
      { path: 'history', element: <History /> },
      { path: 'profile', element: <Profile /> },
    ],
  },
])

export default router
