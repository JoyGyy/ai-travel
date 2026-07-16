/**
 * 路由守卫组件
 * 未登录用户访问受保护页面时，跳转到登录页
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppMessage } from '@/hooks/useAppMessage'
import { useAuthStore } from '@/stores/auth'

export function ProtectedRoute({ children }) {
  const navigate = useNavigate()
  const message = useAppMessage()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  useEffect(() => {
    if (hasHydrated && !user) {
      message.warning('请先登录')
      navigate('/login', { replace: true })
    }
  }, [user, hasHydrated, navigate, message])

  if (!hasHydrated) {
    return (
      <div className="layout-loading" role="status" aria-live="polite">
        <div className="layout-loading__spinner" aria-hidden="true" />
        <span className="layout-loading__text">正在恢复登录状态...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="layout-loading" role="status" aria-live="polite">
        <div className="layout-loading__spinner" aria-hidden="true" />
        <span className="layout-loading__text">正在前往登录页...</span>
      </div>
    )
  }

  return <>{children}</>
}
