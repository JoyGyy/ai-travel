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
  // 等 auth store 水合完成后再执行，确保 user 状态已从 localStorage 恢复
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      const user = useAuthStore.getState().user
      if (user) {
        useHistoryStore.getState().loadUserHistory(user.id)
      }
    })
    // 如果已经水合完成（比如热更新），直接执行
    if (useAuthStore.persist.hasHydrated()) {
      const user = useAuthStore.getState().user
      if (user) {
        useHistoryStore.getState().loadUserHistory(user.id)
      }
    }
    return unsub
  }, [])

  return <RouterProvider router={router} />
}
