/**
 * 路由配置文件
 * 定义应用的所有路由规则和页面组件
 */
import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

const Home = React.lazy(() => import('@/pages/Home'))
const Detail = React.lazy(() => import('@/pages/Detail'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const Weather = React.lazy(() => import('@/pages/Weather'))
const Login = React.lazy(() => import('@/pages/Login'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'detail', element: <ProtectedRoute><Detail /></ProtectedRoute> },
      { path: 'weather', element: <Weather /> },
      { path: 'chat', element: <ProtectedRoute><Chat /></ProtectedRoute> },
      { path: 'login', element: <Login /> },
    ],
  },
])

export default router
