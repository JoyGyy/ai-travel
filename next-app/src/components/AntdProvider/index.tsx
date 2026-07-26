'use client'

/**
 * Ant Design 主题配置提供者（Client Component）
 * 将 ConfigProvider + AntdApp 提取为独立客户端组件
 */
import type { ReactNode } from 'react'

import { App as AntdApp, ConfigProvider } from 'antd'

const theme = {
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
}

export function AntdProvider({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        {children}
      </AntdApp>
    </ConfigProvider>
  )
}
