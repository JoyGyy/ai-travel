/**
 * 路由配置文件
 * 定义应用的所有路由规则和页面组件
 */
import React from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const Home = React.lazy(() => import('@/pages/Home'))
const Detail = React.lazy(() => import('@/pages/Detail'))
const Chat = React.lazy(() => import('@/pages/Chat'))
const Weather = React.lazy(() => import('@/pages/Weather'))
const Login = React.lazy(() => import('@/pages/Login'))
const Attractions = React.lazy(() => import('@/pages/Attractions'))
const AttractionDetail = React.lazy(() => import('@/pages/AttractionDetail'))
const Profile = React.lazy(() => import('@/pages/Profile'))

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <ErrorBoundary><Home /></ErrorBoundary> },
      { path: 'detail', element: <ErrorBoundary><ProtectedRoute><Detail /></ProtectedRoute></ErrorBoundary> },
      { path: 'weather', element: <ErrorBoundary><Weather /></ErrorBoundary> },
      { path: 'chat', element: <ErrorBoundary><ProtectedRoute><Chat /></ProtectedRoute></ErrorBoundary> },
      { path: 'login', element: <ErrorBoundary><Login /></ErrorBoundary> },
      { path: 'attractions', element: <ErrorBoundary><ProtectedRoute><Attractions /></ProtectedRoute></ErrorBoundary> },
      { path: 'attractions/:id', element: <ErrorBoundary><ProtectedRoute><AttractionDetail /></ProtectedRoute></ErrorBoundary> },
      { path: 'profile', element: <ErrorBoundary><ProtectedRoute><Profile /></ProtectedRoute></ErrorBoundary> },
    ],
  },
])

export default router
