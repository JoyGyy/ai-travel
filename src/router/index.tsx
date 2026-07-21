/**
 * 路由配置文件
 * 定义应用的所有路由规则和页面组件
 */
import * as Sentry from '@sentry/react'
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

/** 错误上报：同时输出到控制台和 Sentry */
function handleRouteError(error: Error, errorInfo: React.ErrorInfo) {
  console.error('ErrorBoundary 捕获到错误:', error, errorInfo)
  Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: (
        <ErrorBoundary onError={handleRouteError}>
          <Home />
        </ErrorBoundary>
      ) },
      { path: 'detail', element: (
        <ErrorBoundary onError={handleRouteError}>
          <ProtectedRoute>
            <Detail />
          </ProtectedRoute>
        </ErrorBoundary>
      ) },
      { path: 'weather', element: (
        <ErrorBoundary onError={handleRouteError}>
          <Weather />
        </ErrorBoundary>
      ) },
      { path: 'chat', element: (
        <ErrorBoundary onError={handleRouteError}>
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        </ErrorBoundary>
      ) },
      { path: 'login', element: (
        <ErrorBoundary onError={handleRouteError}>
          <Login />
        </ErrorBoundary>
      ) },
      { path: 'attractions', element: (
        <ErrorBoundary onError={handleRouteError}>
          <ProtectedRoute>
            <Attractions />
          </ProtectedRoute>
        </ErrorBoundary>
      ) },
      { path: 'attractions/:id', element: (
        <ErrorBoundary onError={handleRouteError}>
          <ProtectedRoute>
            <AttractionDetail />
          </ProtectedRoute>
        </ErrorBoundary>
      ) },
      { path: 'profile', element: (
        <ErrorBoundary onError={handleRouteError}>
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </ErrorBoundary>
      ) },
    ],
  },
])

export default router
