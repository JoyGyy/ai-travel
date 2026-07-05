/**
 * 应用根组件
 * 使用 Ant Design ConfigProvider 配置主题，React Router 提供路由功能
 */
import { ConfigProvider } from 'antd'
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'

export default function App() {
  // 页面刷新时恢复认证状态
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      // 认证状态已从 localStorage 恢复
    })
    if (useAuthStore.persist.hasHydrated()) {
      // 已水合完成
    }
    return unsub
  }, [])

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: "'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
