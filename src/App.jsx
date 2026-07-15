/**
 * 应用根组件
 * 使用 Ant Design ConfigProvider 配置主题，React Router 提供路由功能
 */
import { ConfigProvider } from 'antd'
import { RouterProvider } from 'react-router-dom'
import router from '@/router'

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B35',
          colorInfo: '#3B82F6',
          colorBgLayout: '#FFF8F0',
          colorBgElevated: 'rgba(255,255,255,0.92)',
          colorBgContainer: 'rgba(255,255,255,0.96)',
          colorText: '#1C1917',
          colorError: '#DC2626',
          colorWarning: '#D97706',
          colorSuccess: '#059669',
          borderRadius: 12,
          fontFamily: '\'Plus Jakarta Sans\', \'Noto Sans SC\', -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
