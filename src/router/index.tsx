/**
 * 路由配置文件
 * 定义应用的所有路由规则和页面组件
 */
import React, { Suspense } from 'react'
import { createBrowserRouter, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AppOutline, UnorderedListOutline, ChatAddOutline, UserOutline } from 'antd-mobile-icons'
import { TabBar } from '@/components/TabBar'

// 使用 React.lazy 实现路由级别的代码分割
// 每个页面组件会被打包为独立的 chunk，实现按需加载
const Home = React.lazy(() => import('@/pages/Home'))
const Detail = React.lazy(() => import('@/pages/Detail'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const History = React.lazy(() => import('@/pages/History'))
const Profile = React.lazy(() => import('@/pages/Profile'))

/**
 * PC 端顶部水平导航组件
 * 仅在 md 及以上屏幕显示，替代移动端底部 TabBar
 */
function DesktopNav() {
  const location = useLocation()
  const navigate = useNavigate()

  // 计算当前激活的标签键
  const activeKey = location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  // 导航标签配置
  const tabs = [
    { key: '/', title: '首页', icon: <AppOutline /> },
    { key: '/history', title: '历史', icon: <UnorderedListOutline /> },
    { key: '/chat', title: 'AI咨询', icon: <ChatAddOutline /> },
    { key: '/profile', title: '我的', icon: <UserOutline /> },
  ]

  return (
    <nav className="flex items-center gap-1">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => navigate(tab.key)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg border-none cursor-pointer text-sm transition-colors"
          style={{
            background: activeKey === tab.key ? 'var(--c-sand)' : 'transparent',
            color: activeKey === tab.key ? 'var(--c-terracotta)' : 'var(--c-ink-light)',
          }}
        >
          <span className="text-base">{tab.icon}</span>
          <span>{tab.title}</span>
        </button>
      ))}
    </nav>
  )
}

/**
 * 布局组件
 * 作为所有页面的父组件，提供统一的布局结构
 * 包含页面内容区域和底部导航栏
 * 响应式适配：移动端底部导航，PC 端顶部导航 + 内容限宽居中
 */
function Layout() {
  const location = useLocation()

  // 需要显示底部导航栏的路由路径
  const tabRoutes = ['/', '/history', '/chat', '/profile']
  // 判断当前路由是否需要显示导航栏
  const showTabbar = tabRoutes.includes(location.pathname)

  return (
    <div className={`min-h-screen ${showTabbar ? 'pb-[50px] md:pb-0' : ''}`} style={{ background: 'var(--c-paper)' }}>
      {/* PC 端顶部导航栏 - 仅在 md 及以上屏幕显示 */}
      {showTabbar && (
        <div className="hidden md:block sticky top-0 z-50" style={{ background: 'var(--c-white)', borderBottom: '1px solid var(--c-paper-dark)' }}>
          <div className="mx-auto flex items-center" style={{ maxWidth: '1200px', height: '56px', padding: '0 24px' }}>
            {/* Logo */}
            <span className="text-lg font-bold mr-8" style={{ fontFamily: 'var(--font-serif)', color: 'var(--c-terracotta)' }}>
              AI 旅行助手
            </span>
            {/* 桌面导航链接 */}
            <DesktopNav />
          </div>
        </div>
      )}

      {/* 内容区域 - 限宽 1200px 居中 */}
      <div className="mx-auto" style={{ maxWidth: '1200px' }}>
        {/* Suspense 提供加载状态，当 lazy 组件加载时显示 fallback 内容 */}
        <Suspense fallback={<div className="flex items-center justify-center h-screen" style={{ color: 'var(--c-ink-light)' }}>加载中...</div>}>
          {/* Outlet 渲染匹配的子路由组件 */}
          <Outlet />
        </Suspense>
      </div>

      {/* 移动端底部导航栏 - PC 端隐藏 */}
      {showTabbar && (
        <div className="md:hidden">
          <TabBar />
        </div>
      )}
    </div>
  )
}

/**
 * 创建路由配置
 * 使用 createBrowserRouter 定义路由树结构
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />, // 根布局组件
    children: [
      { index: true, element: <Home /> }, // 首页 - 默认路由
      { path: 'detail', element: <Detail /> }, // 行程详情页
      { path: 'chat', element: <Chat /> }, // AI 对话页
      { path: 'history', element: <History /> }, // 历史记录页
      { path: 'profile', element: <Profile /> }, // 个人中心页
    ],
  },
])

export default router
