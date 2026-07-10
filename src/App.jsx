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
          colorPrimary: '#6366f1',
          borderRadius: 8,
          fontFamily: '\'Noto Sans SC\', -apple-system, BlinkMacSystemFont, sans-serif',
        },
      }}
    >
      <RouterProvider router={router} />
    </ConfigProvider>
  )
}
