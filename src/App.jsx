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
          colorPrimary: '#7C3AED',
          colorInfo: '#6366F1',
          colorBgLayout: '#F4F0FF',
          colorBgElevated: 'rgba(255,255,255,0.78)',
          colorBgContainer: 'rgba(255,255,255,0.72)',
          colorText: '#0F172A',
          colorError: '#DC2626',
          colorWarning: '#B45309',
          colorSuccess: '#047857',
          borderRadius: 14,
          fontFamily: '\'Plus Jakarta Sans\', \'Noto Sans SC\', -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
