/**
 * 路由配置文件
 * 定义应用的所有路由规则和页面组件
 */
import React, { Suspense } from 'react'
import { createBrowserRouter, Outlet, useLocation } from 'react-router-dom'
import { TabBar } from '@/components/TabBar'

// 使用 React.lazy 实现路由级别的代码分割
// 每个页面组件会被打包为独立的 chunk，实现按需加载
const Home = React.lazy(() => import('@/pages/Home'))
const Detail = React.lazy(() => import('@/pages/Detail'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const History = React.lazy(() => import('@/pages/History'))
const Profile = React.lazy(() => import('@/pages/Profile'))

/**
 * 布局组件
 * 作为所有页面的父组件，提供统一的布局结构
 * 包含页面内容区域和底部导航栏
 */
function Layout() {
  const location = useLocation()

  // 需要显示底部导航栏的路由路径
  const tabRoutes = ['/', '/history', '/chat', '/profile']
  // 判断当前路由是否需要显示导航栏
  const showTabbar = tabRoutes.includes(location.pathname)

  return (
    <div className={`min-h-screen ${showTabbar ? 'pb-[50px]' : ''}`} style={{ background: 'var(--c-paper)' }}>
      {/* Suspense 提供加载状态，当 lazy 组件加载时显示 fallback 内容 */}
      <Suspense fallback={<div className="flex items-center justify-center h-screen" style={{ color: 'var(--c-ink-light)' }}>加载中...</div>}>
        {/* Outlet 渲染匹配的子路由组件 */}
        <Outlet />
      </Suspense>
      {/* 条件渲染底部导航栏 */}
      {showTabbar && <TabBar />}
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
