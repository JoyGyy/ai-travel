import type { MessageInstance } from 'antd/es/message/interface'

/**
 * 获取 Ant Design App 上下文中的 message API
 * 避免静态 message.* 无法读取 ConfigProvider 主题上下文的问题
 */
import { App as AntdApp } from 'antd'

export function useAppMessage(): MessageInstance {
  const { message } = AntdApp.useApp()
  return message
}
