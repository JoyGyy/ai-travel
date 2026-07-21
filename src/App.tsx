/**
 * 应用根组件
 * 使用 Ant Design ConfigProvider 配置主题，React Router 提供路由功能
 */
import { App as AntdApp, ConfigProvider } from 'antd'
import { RouterProvider } from 'react-router-dom'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import router from '@/router'

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#FF6B35',
          colorInfo: '#3B82F6',
          colorBgLayout: '#FAFAF8',
          colorBgElevated: 'rgba(255,255,255,0.92)',
          colorBgContainer: 'rgba(255,255,255,0.96)',
          colorText: '#1C1917',
          colorError: '#DC2626',
          colorWarning: '#D97706',
          colorSuccess: '#059669',
          controlHeight: 44,
          controlHeightLG: 48,
          controlHeightSM: 36,
          borderRadius: 14,
          borderRadiusLG: 18,
          fontFamily: '\'Plus Jakarta Sans\', \'Noto Sans SC\', -apple-system, BlinkMacSystemFont, sans-serif',
        },
        components: {
          Button: {
            borderRadius: 14,
            controlHeight: 44,
            controlHeightLG: 48,
            fontWeight: 800,
          },
          Card: {
            borderRadiusLG: 24,
            boxShadowTertiary: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.03)',
          },
          Input: {
            borderRadius: 14,
            controlHeight: 44,
          },
          Progress: {
            defaultColor: '#FF6B35',
            remainingColor: 'rgba(28,25,23,0.08)',
          },
          Select: {
            borderRadius: 14,
            controlHeight: 44,
          },
        },
      }}
    >
      <AntdApp>
        <ErrorBoundary>
          <RouterProvider router={router} />
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  )
}
