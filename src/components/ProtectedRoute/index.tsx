/**
 * 路由守卫组件
 * 保护需要登录才能访问的路由页面
 * 未登录用户访问受保护页面时，显示提示并跳转到登录页
 * 等待 Zustand 持久化恢复完成后再做判断，避免闪烁
 */
import type { ReactNode } from 'react'

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAppMessage } from '@/hooks/useAppMessage'
import { useAuthStore } from '@/stores/auth'

/* ========== 类型定义 ========== */

interface ProtectedRouteProps {
  children: ReactNode
}

/* ========== 路由守卫逻辑 ========== */

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const message = useAppMessage()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  /** 持久化恢复完成后，若未登录则跳转登录页 */
  useEffect(() => {
    if (hasHydrated && !user) {
      message.warning('请先登录')
      navigate('/login', { replace: true })
    }
  }, [user, hasHydrated, navigate, message])

  /* ========== 渲染逻辑 ========== */

  // Zustand 尚未从 localStorage 恢复，展示加载态
  if (!hasHydrated) {
    return (
      <div className="layout-loading" role="status" aria-live="polite">
        <div className="layout-loading__spinner" aria-hidden="true" />
        <span className="layout-loading__text">正在恢复登录状态...</span>
      </div>
    )
  }

  // 已恢复但未登录，展示跳转提示
  if (!user) {
    return (
      <div className="layout-loading" role="status" aria-live="polite">
        <div className="layout-loading__spinner" aria-hidden="true" />
        <span className="layout-loading__text">正在前往登录页...</span>
      </div>
    )
  }

  // 已登录，正常渲染子组件
  return <>{children}</>
}
