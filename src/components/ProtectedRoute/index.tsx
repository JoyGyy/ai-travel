/**
 * 路由守卫组件
 * 未登录用户访问受保护页面时，跳转到登录页并提示
 */
import { Toast } from 'antd-mobile'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate()
  const user = useAuthStore(state => state.user)
  const hasHydrated = useAuthStore(state => state._hasHydrated)

  useEffect(() => {
    if (hasHydrated && !user) {
      Toast.show({ content: '请先登录', position: 'center' })
      navigate('/login', { replace: true })
    }
  }, [user, hasHydrated, navigate])

  if (!hasHydrated || !user) return null

  return <>{children}</>
}
