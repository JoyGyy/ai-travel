/**
 * 应用根组件
 * 使用 React Router 的 RouterProvider 提供路由功能
 */
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useHistoryStore } from '@/stores/history'

export default function App() {
  // 页面刷新时，如果用户已登录，加载对应的历史记录
  useEffect(() => {
    const user = useAuthStore.getState().user
    if (user) {
      useHistoryStore.getState().loadUserHistory(user.id)
    }
  }, [])

  return <RouterProvider router={router} />
}
